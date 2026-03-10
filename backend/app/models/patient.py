from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    dni = Column(String, unique=True, nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True)  # masculino, femenino, otro, prefiero_no_decir
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    civil_status = Column(String, nullable=True)
    education_level = Column(String, nullable=True)
    
    # Emergency contact
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    emergency_contact_relation = Column(String, nullable=True)
    
    # Insurance
    insurance_provider = Column(String, nullable=True)
    insurance_number = Column(String, nullable=True)
    
    # CRM fields
    referral_source = Column(String, nullable=True)
    referred_by = Column(String, nullable=True)
    status = Column(String, default="active")  # active, inactive, discharged, waitlist
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    intake_date = Column(Date, nullable=True)
    discharge_date = Column(Date, nullable=True)
    
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    therapist = relationship("User", back_populates="patients", foreign_keys=[therapist_id])
    appointments = relationship("Appointment", back_populates="patient")
    clinical_sessions = relationship("ClinicalSession", back_populates="patient")
    diagnoses = relationship("Diagnosis", back_populates="patient")
    treatment_plans = relationship("TreatmentPlan", back_populates="patient")
    invoices = relationship("Invoice", back_populates="patient")
