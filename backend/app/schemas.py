from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Barber schemas
class BarberBase(BaseModel):
    name: str
    description: Optional[str] = None
    working_hours: Optional[str] = None

class BarberCreate(BarberBase):
    pass

class BarberUpdate(BarberBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class Barber(BarberBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Service schemas
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int

class ServiceCreate(ServiceBase):
    barber_id: int

class ServiceUpdate(ServiceBase):
    name: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None

class Service(ServiceBase):
    id: int
    barber_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Appointment schemas
class AppointmentBase(BaseModel):
    client_name: str
    client_email: str
    client_phone: str
    appointment_datetime: datetime
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    barber_id: int
    service_id: int

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    appointment_datetime: Optional[datetime] = None

class Appointment(AppointmentBase):
    id: int
    barber_id: int
    service_id: int
    status: str
    confirmation_token: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Response schemas with relationships
class BarberWithServices(Barber):
    services: List[Service] = []

class AppointmentWithDetails(Appointment):
    barber: Barber
    service: Service

# Booking availability schema
class TimeSlot(BaseModel):
    datetime: datetime
    available: bool

class AvailabilityResponse(BaseModel):
    date: str
    slots: List[TimeSlot]
