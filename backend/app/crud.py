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
def get_service(db: Session, service_id: int) -> Optional[Service]:
    return db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()

def get_services_by_barber(db: Session, barber_id: int) -> List[Service]:
    return db.query(Service).filter(
        Service.barber_id == barber_id, 
        Service.is_active == True
    ).all()

def create_service(db: Session, service: ServiceCreate) -> Service:
    db_service = Service(**service.dict())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def update_service(db: Session, service_id: int, service_update: ServiceUpdate) -> Optional[Service]:
    db_service = get_service(db, service_id)
    if db_service:
        update_data = service_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_service, field, value)
        db.commit()
        db.refresh(db_service)
    return db_service

# Appointment CRUD operations
def get_appointment(db: Session, appointment_id: int) -> Optional[Appointment]:
    return db.query(Appointment).filter(Appointment.id == appointment_id).first()

def get_appointment_by_token(db: Session, token: str) -> Optional[Appointment]:
    return db.query(Appointment).filter(Appointment.confirmation_token == token).first()

def get_appointments(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[Appointment]:
    query = db.query(Appointment)
    if status:
        query = query.filter(Appointment.status == status)
    return query.offset(skip).limit(limit).all()

def create_appointment(db: Session, appointment: AppointmentCreate) -> Appointment:
    db_appointment = Appointment(**appointment.dict())
    db_appointment.confirmation_token = str(uuid.uuid4())
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

def confirm_appointment(db: Session, token: str) -> Optional[Appointment]:
    db_appointment = get_appointment_by_token(db, token)
    if db_appointment and db_appointment.status == "pending":
        db_appointment.status = "confirmed"
        db_appointment.confirmed_at = datetime.utcnow()
        db.commit()
        db.refresh(db_appointment)
    return db_appointment

def check_appointment_conflict(db: Session, barber_id: int, appointment_datetime: datetime, duration_minutes: int, exclude_id: Optional[int] = None) -> bool:
    """Check if there's a conflicting appointment for the barber at the given time"""
    start_time = appointment_datetime
    end_time = appointment_datetime + timedelta(minutes=duration_minutes)

    # Get all appointments for this barber that might conflict
    existing_appointments = db.query(Appointment).join(Service).filter(
        Appointment.barber_id == barber_id,
        Appointment.status.in_(["pending", "confirmed"])
    ).all()

    if exclude_id:
        existing_appointments = [apt for apt in existing_appointments if apt.id != exclude_id]

    # Check each existing appointment for conflicts
    for existing_apt in existing_appointments:
        existing_start = existing_apt.appointment_datetime
        existing_end = existing_apt.appointment_datetime + timedelta(minutes=existing_apt.service.duration_minutes)

        # Check if times overlap
        if (start_time < existing_end and end_time > existing_start):
            return True

    return False
