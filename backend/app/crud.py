from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.models import Barber, Service, Appointment
from app.schemas import BarberCreate, BarberUpdate, ServiceCreate, ServiceUpdate, AppointmentCreate, AppointmentUpdate

# Barber CRUD operations
def get_barber(db: Session, barber_id: int) -> Optional[Barber]:
    return db.query(Barber).filter(Barber.id == barber_id, Barber.is_active == True).first()

def get_barbers(db: Session, skip: int = 0, limit: int = 100) -> List[Barber]:
    return db.query(Barber).filter(Barber.is_active == True).offset(skip).limit(limit).all()

def create_barber(db: Session, barber: BarberCreate) -> Barber:
    db_barber = Barber(**barber.dict())
    db.add(db_barber)
    db.commit()
    db.refresh(db_barber)
    return db_barber

def update_barber(db: Session, barber_id: int, barber_update: BarberUpdate) -> Optional[Barber]:
    db_barber = get_barber(db, barber_id)
    if db_barber:
        update_data = barber_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_barber, field, value)
        db.commit()
        db.refresh(db_barber)
    return db_barber

def delete_barber(db: Session, barber_id: int) -> bool:
    db_barber = get_barber(db, barber_id)
    if db_barber:
        db_barber.is_active = False
        db.commit()
        return True
    return False

# Service CRUD operations
def get_service(db: Session, service_id: int, active_only: bool = True) -> Optional[Service]:
    """Get a service by ID. By default only returns active services."""
    query = db.query(Service).filter(Service.id == service_id)
    if active_only:
        query = query.filter(Service.is_active == True)
    return query.first()

def get_services_by_barber(db: Session, barber_id: int, include_inactive: bool = False) -> List[Service]:
    query = db.query(Service).filter(Service.barber_id == barber_id)
    if not include_inactive:
        query = query.filter(Service.is_active == True)
    return query.all()

def create_service(db: Session, service: ServiceCreate) -> Service:
    db_service = Service(**service.dict())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def update_service(db: Session, service_id: int, service_update: ServiceUpdate) -> Optional[Service]:
    # Admin can update any service regardless of active status
    db_service = get_service(db, service_id, active_only=False)
    if db_service:
        update_data = service_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_service, field, value)
        db.commit()
        db.refresh(db_service)
    return db_service

def delete_service(db: Session, service_id: int) -> bool:
    """Delete a service (hard delete)"""
    db_service = get_service(db, service_id, active_only=False)
    if db_service:
        db.delete(db_service)
        db.commit()
        return True
    return False

# Appointment CRUD operations
def get_appointment(db: Session, appointment_id: int) -> Optional[Appointment]:
    return db.query(Appointment).filter(Appointment.id == appointment_id).first()

def get_appointment_by_cancellation_token(db: Session, token: str) -> Optional[Appointment]:
    return db.query(Appointment).filter(Appointment.cancellation_token == token).first()

def get_appointments(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[Appointment]:
    query = db.query(Appointment)
    if status:
        query = query.filter(Appointment.status == status)
    return query.offset(skip).limit(limit).all()

def create_appointment(db: Session, appointment: AppointmentCreate) -> Appointment:
    # Extract service_ids and create appointment without them
    appointment_data = appointment.dict(exclude={'service_ids'})
    db_appointment = Appointment(**appointment_data)
    db_appointment.cancellation_token = str(uuid.uuid4())
    db_appointment.status = "confirmed"  # Automatically confirm
    db_appointment.confirmed_at = datetime.utcnow()
    
    # Add services to the appointment
    for service_id in appointment.service_ids:
        service = get_service(db, service_id)
        if service:
            db_appointment.services.append(service)
    
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def update_appointment(db: Session, appointment_id: int, appointment_update: AppointmentUpdate) -> Optional[Appointment]:
    db_appointment = get_appointment(db, appointment_id)
    if db_appointment:
        update_data = appointment_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_appointment, field, value)
        if appointment_update.status == "confirmed":
            db_appointment.confirmed_at = datetime.utcnow()
        db.commit()
        db.refresh(db_appointment)
    return db_appointment

def cancel_appointment(db: Session, token: str) -> Optional[Appointment]:
    """Cancel an appointment if it's at least 2 hours away"""
    db_appointment = get_appointment_by_cancellation_token(db, token)
    if db_appointment and db_appointment.status == "confirmed":
        # Check if appointment is at least 2 hours away
        now = datetime.utcnow()
        time_until_appointment = db_appointment.appointment_datetime - now
        if time_until_appointment.total_seconds() >= 7200:  # 2 hours = 7200 seconds
            db_appointment.status = "cancelled"
            db.commit()
            db.refresh(db_appointment)
            return db_appointment
    return None

def check_appointment_conflict(db: Session, barber_id: int, appointment_datetime: datetime, duration_minutes: int, exclude_id: Optional[int] = None) -> bool:
    """Check if there's a conflicting appointment for the barber at the given time"""
    start_time = appointment_datetime
    end_time = appointment_datetime + timedelta(minutes=duration_minutes)

    # Get all appointments for this barber that might conflict
    existing_appointments = db.query(Appointment).filter(
        Appointment.barber_id == barber_id,
        Appointment.status == "confirmed"
    ).all()

    if exclude_id:
        existing_appointments = [apt for apt in existing_appointments if apt.id != exclude_id]

    # Check each existing appointment for conflicts
    for existing_apt in existing_appointments:
        existing_start = existing_apt.appointment_datetime
        # Calculate total duration for all services in the appointment
        total_duration = sum(service.duration_minutes for service in existing_apt.services)
        existing_end = existing_apt.appointment_datetime + timedelta(minutes=total_duration)

        # Check if times overlap
        if (start_time < existing_end and end_time > existing_start):
            return True

    return False

def get_available_time_slots(db: Session, barber_id: int, date, duration_minutes: int) -> List[dict]:
    """Generate available time slots for a barber on a specific date"""
    from datetime import datetime, time, timedelta
    
    # Define working hours (9 AM to 6 PM)
    work_start = time(9, 0)
    work_end = time(18, 0)
    
    # Slot interval in minutes (every 30 minutes)
    slot_interval = 30
    
    # Combine date with work start time
    current_slot = datetime.combine(date, work_start)
    end_of_day = datetime.combine(date, work_end)
    
    available_slots = []
    
    # Generate slots
    while current_slot < end_of_day:
        # Check if this slot plus duration fits within working hours
        slot_end = current_slot + timedelta(minutes=duration_minutes)
        
        if slot_end.time() <= work_end:
            # Check if the slot is available (no conflicts)
            if not check_appointment_conflict(db, barber_id, current_slot, duration_minutes):
                # Check if the slot is not in the past
                if current_slot > datetime.now():
                    available_slots.append({
                        "time": current_slot.strftime("%H:%M"),
                        "datetime": current_slot.isoformat(),
                        "available": True
                    })
        
        # Move to next slot
        current_slot += timedelta(minutes=slot_interval)
    
    return available_slots
