from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    therapist = "therapist"
    receptionist = "receptionist"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="therapist")
    specialty = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patients = relationship("Patient", back_populates="therapist", foreign_keys="Patient.therapist_id")
    appointments = relationship("Appointment", back_populates="therapist")
    sessions = relationship("ClinicalSession", back_populates="therapist")
