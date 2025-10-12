from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class Barber(Base):
    __tablename__ = "barbers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    working_hours = Column(String(200), nullable=True)  # JSON string: {"monday": "09:00-17:00", ...}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    services = relationship("Service", back_populates="barber", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="barber")

class Service(Base):
    __tablename__ = "services"
    
    id = Column(Integer, primary_key=True, index=True)
    barber_id = Column(Integer, ForeignKey("barbers.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    barber = relationship("Barber", back_populates="services")
    appointments = relationship("Appointment", back_populates="service")

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    barber_id = Column(Integer, ForeignKey("barbers.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    
    # Client information
    client_name = Column(String(100), nullable=False)
    client_email = Column(String(100), nullable=False)
    client_phone = Column(String(20), nullable=False)
    
    # Appointment details
    appointment_datetime = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="pending")  # pending, confirmed, cancelled
    confirmation_token = Column(String(100), unique=True, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    barber = relationship("Barber", back_populates="appointments")
    service = relationship("Service", back_populates="appointments")
    
    def generate_confirmation_token(self):
        """Generate a unique confirmation token"""
        self.confirmation_token = str(uuid.uuid4())
