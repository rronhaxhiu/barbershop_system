from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import re

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
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AppointmentCreate(AppointmentBase):
    barber_id: int
    service_ids: List[int]  # Changed from service_id to service_ids (list)
    
    @field_validator('client_phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Remove whitespace for validation
        phone_cleaned = v.strip()
        
        # Check if empty
        if not phone_cleaned:
            raise ValueError('Phone number cannot be empty')
        
        # Check if it contains only valid phone characters
        if not re.match(r'^[0-9+\-\s()]+$', phone_cleaned):
            raise ValueError('Phone number must contain only numbers and phone formatting characters (+, -, spaces, parentheses)')
        
        # Extract only digits to check minimum length
        digits_only = re.sub(r'[^0-9]', '', phone_cleaned)
        if len(digits_only) < 7:
            raise ValueError('Phone number must contain at least 7 digits')
        
        return v

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    appointment_datetime: Optional[datetime] = None

class Appointment(AppointmentBase):
    id: int
    barber_id: int
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
    services: List[Service]  # Changed from service to services (list)

# Booking availability schema
class TimeSlot(BaseModel):
    datetime: datetime
    available: bool

class AvailabilityResponse(BaseModel):
    date: str
    slots: List[TimeSlot]

# Authentication schemas
class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class AdminUser(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
