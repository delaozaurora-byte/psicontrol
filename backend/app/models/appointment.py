from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    type = Column(String, default="followup")  # initial, followup, group, evaluation
    status = Column(String, default="scheduled")  # scheduled, confirmed, completed, cancelled, no_show
    modality = Column(String, default="presencial")  # presencial, online
    room = Column(String, nullable=True)
    fee = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Frontend alias
    @property
    def appointment_type(self):
        return self.type

    patient = relationship("Patient", back_populates="appointments")
    therapist = relationship("User", back_populates="appointments")
    clinical_session = relationship("ClinicalSession", back_populates="appointment", uselist=False)
    invoice = relationship("Invoice", back_populates="appointment", uselist=False)
