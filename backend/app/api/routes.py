from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from app.database import get_db
from app import crud, schemas
from app.email_service import email_service
from app.auth import authenticate_admin, create_access_token, get_current_admin, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models import Admin, Appointment

router = APIRouter()

# Public routes for client booking
@router.get("/barbers", response_model=List[schemas.BarberWithServices])
def get_barbers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all active barbers with their services"""
    barbers = crud.get_barbers(db, skip=skip, limit=limit)
    for barber in barbers:
        barber.services = crud.get_services_by_barber(db, barber.id)
    return barbers

@router.get("/barbers/{barber_id}", response_model=schemas.BarberWithServices)
def get_barber(barber_id: int, db: Session = Depends(get_db)):
    """Get a specific barber with services"""
    barber = crud.get_barber(db, barber_id)
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    barber.services = crud.get_services_by_barber(db, barber_id)
    return barber

@router.get("/barbers/{barber_id}/services", response_model=List[schemas.Service])
def get_barber_services(barber_id: int, include_inactive: bool = False, db: Session = Depends(get_db)):
    """Get all services for a specific barber"""
    barber = crud.get_barber(db, barber_id)
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    return crud.get_services_by_barber(db, barber_id, include_inactive)

@router.post("/appointments", response_model=schemas.Appointment)
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    """Create a new appointment"""
    # Validate barber exists
    barber = crud.get_barber(db, appointment.barber_id)
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    
    # Validate at least one service is provided
    if not appointment.service_ids or len(appointment.service_ids) == 0:
        raise HTTPException(status_code=400, detail="At least one service must be selected")
    
    # Validate all services exist and belong to barber
    services = []
    total_duration = 0
    total_price = 0
    
    for service_id in appointment.service_ids:
        service = crud.get_service(db, service_id)
        if not service:
            raise HTTPException(status_code=404, detail=f"Service {service_id} not found")
        if service.barber_id != appointment.barber_id:
            raise HTTPException(status_code=400, detail=f"Service {service_id} does not belong to this barber")
        services.append(service)
        total_duration += service.duration_minutes
        total_price += service.price
    
    # Check for appointment conflicts
    if crud.check_appointment_conflict(db, appointment.barber_id, appointment.appointment_datetime, total_duration):
        raise HTTPException(status_code=400, detail="Time slot not available")
    
    # Create appointment
    db_appointment = crud.create_appointment(db, appointment)
    
    # Send confirmation email
    try:
        service_names = ", ".join([s.name for s in services])
        appointment_data = {
            'client_name': db_appointment.client_name,
            'client_email': db_appointment.client_email,
            'barber_name': barber.name,
            'service_name': service_names,
            'appointment_datetime': db_appointment.appointment_datetime.strftime('%Y-%m-%d %H:%M'),
            'duration_minutes': total_duration,
            'price': total_price,
            'notes': db_appointment.notes or '',
            'confirmation_token': db_appointment.confirmation_token,
            'confirmation_url': f"http://192.168.3.253:3000/confirm/{db_appointment.confirmation_token}"
        }
        email_service.send_appointment_confirmation(appointment_data)
    except Exception as e:
        # Log error but don't fail the appointment creation
        print(f"Failed to send confirmation email: {e}")
    
    return db_appointment

@router.get("/appointments/confirm/{token}")
def confirm_appointment(token: str, db: Session = Depends(get_db)):
    """Confirm an appointment using the confirmation token"""
    appointment = crud.confirm_appointment(db, token)
    if not appointment:
        raise HTTPException(status_code=404, detail="Invalid confirmation token or appointment already confirmed")
    
    return {"message": "Appointment confirmed successfully", "appointment_id": appointment.id}

@router.get("/barbers/{barber_id}/available-slots")
def get_available_slots(
    barber_id: int, 
    date: str,  # Format: YYYY-MM-DD
    duration_minutes: int,
    db: Session = Depends(get_db)
):
    """Get available time slots for a barber on a specific date"""
    # Validate barber exists
    barber = crud.get_barber(db, barber_id)
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    
    # Parse the date
    try:
        from datetime import datetime, time
        selected_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Generate available slots
    available_slots = crud.get_available_time_slots(
        db, 
        barber_id, 
        selected_date, 
        duration_minutes
    )
    
    return {"date": date, "slots": available_slots}

# Authentication routes
@router.post("/auth/login", response_model=schemas.Token)
def login(login_data: schemas.AdminLogin, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    admin = authenticate_admin(db, login_data.username, login_data.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": admin.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/auth/me", response_model=schemas.AdminUser)
async def get_current_user(current_admin: Admin = Depends(get_current_admin)):
    """Get current authenticated admin user"""
    return current_admin

# Admin routes (protected)
@router.get("/admin/appointments", response_model=List[schemas.AppointmentWithDetails])
def get_all_appointments(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Admin: Get all appointments with details"""
    from sqlalchemy.orm import joinedload
    
    # Use eager loading to fetch appointments with their relationships
    query = db.query(Appointment).options(
        joinedload(Appointment.barber),
        joinedload(Appointment.services)
    )
    
    if status:
        query = query.filter(Appointment.status == status)
    
    appointments = query.offset(skip).limit(limit).all()
    
    return appointments

@router.post("/admin/barbers", response_model=schemas.Barber)
def create_barber(
    barber: schemas.BarberCreate, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Admin: Create a new barber"""
    return crud.create_barber(db, barber)

@router.put("/admin/barbers/{barber_id}", response_model=schemas.Barber)
def update_barber(
    barber_id: int, 
    barber_update: schemas.BarberUpdate, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Admin: Update a barber"""
    updated_barber = crud.update_barber(db, barber_id, barber_update)
    if not updated_barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    return updated_barber

@router.delete("/admin/barbers/{barber_id}")
def delete_barber(
    barber_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Admin: Delete (deactivate) a barber"""
    if not crud.delete_barber(db, barber_id):
        raise HTTPException(status_code=404, detail="Barber not found")
    return {"message": "Barber deleted successfully"}

@router.post("/admin/services", response_model=schemas.Service)
def create_service(
    service: schemas.ServiceCreate, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Admin: Create a new service"""
    # Validate barber exists
    barber = crud.get_barber(db, service.barber_id)
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    
    return crud.create_service(db, service)

@router.put("/admin/services/{service_id}", response_model=schemas.Service)
def update_service(
    service_id: int, 
    service_update: schemas.ServiceUpdate, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Admin: Update a service"""
    updated_service = crud.update_service(db, service_id, service_update)
    if not updated_service:
        raise HTTPException(status_code=404, detail="Service not found")
    return updated_service

@router.delete("/admin/services/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Admin: Delete a service permanently"""
    if not crud.delete_service(db, service_id):
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}

@router.put("/admin/appointments/{appointment_id}", response_model=schemas.Appointment)
def update_appointment(
    appointment_id: int, 
    appointment_update: schemas.AppointmentUpdate, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Admin: Update an appointment"""
    updated_appointment = crud.update_appointment(db, appointment_id, appointment_update)
    if not updated_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return updated_appointment
