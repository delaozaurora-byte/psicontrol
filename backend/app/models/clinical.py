from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Date, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ClinicalSession(Base):
    __tablename__ = "clinical_sessions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    session_date = Column(DateTime, nullable=False)
    session_number = Column(Integer, nullable=True)
    modality = Column(String, default="in_person")  # in_person, online, phone

    # SOAP Notes
    subjective = Column(Text, nullable=True)
    objective = Column(Text, nullable=True)
    assessment = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)

    # Mental status
    mood = Column(String, nullable=True)
    affect = Column(String, nullable=True)
    behavior = Column(String, nullable=True)
    cognition = Column(String, nullable=True)

    # Progress
    progress_rating = Column(Integer, nullable=True)  # 1-10
    risk_level = Column(String, default="none")  # none, low, moderate, high

    homework_assigned = Column(Text, nullable=True)
    next_session_plan = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=50)
    is_confidential = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="clinical_sessions")
    therapist = relationship("User", back_populates="sessions")
    appointment = relationship("Appointment", back_populates="clinical_session")


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    icd10_code = Column(String, nullable=True)
    dsm5_code = Column(String, nullable=True)
    description = Column(String, nullable=False)
    date_diagnosed = Column(Date, nullable=False)
    is_primary = Column(Boolean, default=False)
    status = Column(String, default="active")  # active, resolved, ruled_out
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Frontend alias
    @property
    def code(self):
        return self.icd10_code or self.dsm5_code

    patient = relationship("Patient", back_populates="diagnoses")


class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    goals = Column(Text, nullable=True)
    interventions = Column(Text, nullable=True)
    frequency = Column(String, nullable=True)  # semanal, quincenal, mensual
    approach = Column(String, nullable=True)  # TCC, psicoanalítico, humanista, etc.
    start_date = Column(Date, nullable=False)
    review_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String, default="active")  # active, completed, paused
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="treatment_plans")
