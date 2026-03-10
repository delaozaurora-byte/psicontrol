from pydantic import BaseModel, computed_field
from typing import Optional
from datetime import datetime, date


class ClinicalSessionCreate(BaseModel):
    patient_id: int
    therapist_id: int
    appointment_id: Optional[int] = None
    session_date: datetime
    session_number: Optional[int] = None
    modality: str = "in_person"  # in_person, online, phone
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    summary: Optional[str] = None
    mood: Optional[str] = None
    affect: Optional[str] = None
    behavior: Optional[str] = None
    cognition: Optional[str] = None
    progress_rating: Optional[int] = None
    risk_level: str = "none"
    homework_assigned: Optional[str] = None
    next_session_plan: Optional[str] = None
    duration_minutes: int = 50


class ClinicalSessionUpdate(BaseModel):
    modality: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    summary: Optional[str] = None
    mood: Optional[str] = None
    affect: Optional[str] = None
    behavior: Optional[str] = None
    cognition: Optional[str] = None
    progress_rating: Optional[int] = None
    risk_level: Optional[str] = None
    homework_assigned: Optional[str] = None
    next_session_plan: Optional[str] = None
    duration_minutes: Optional[int] = None


class ClinicalSessionResponse(BaseModel):
    id: int
    patient_id: int
    therapist_id: int
    appointment_id: Optional[int] = None
    session_date: datetime
    session_number: Optional[int] = None
    modality: str = "in_person"
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    summary: Optional[str] = None
    mood: Optional[str] = None
    affect: Optional[str] = None
    behavior: Optional[str] = None
    cognition: Optional[str] = None
    progress_rating: Optional[int] = None
    risk_level: str = "none"
    homework_assigned: Optional[str] = None
    next_session_plan: Optional[str] = None
    duration_minutes: int = 50
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DiagnosisCreate(BaseModel):
    patient_id: int
    therapist_id: int
    # Accept code (frontend) OR icd10_code/dsm5_code (direct)
    code: Optional[str] = None
    icd10_code: Optional[str] = None
    dsm5_code: Optional[str] = None
    description: str
    date_diagnosed: date
    is_primary: bool = False
    status: str = "active"
    notes: Optional[str] = None

    def to_db_dict(self):
        icd = self.icd10_code or self.code
        return {
            'patient_id': self.patient_id,
            'therapist_id': self.therapist_id,
            'icd10_code': icd,
            'dsm5_code': self.dsm5_code,
            'description': self.description,
            'date_diagnosed': self.date_diagnosed,
            'is_primary': self.is_primary,
            'status': self.status,
            'notes': self.notes,
        }


class DiagnosisUpdate(BaseModel):
    code: Optional[str] = None
    icd10_code: Optional[str] = None
    dsm5_code: Optional[str] = None
    description: Optional[str] = None
    is_primary: Optional[bool] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class DiagnosisResponse(BaseModel):
    id: int
    patient_id: int
    therapist_id: int
    icd10_code: Optional[str] = None
    dsm5_code: Optional[str] = None
    description: str
    date_diagnosed: date
    is_primary: bool = False
    status: str = "active"
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    @computed_field
    @property
    def code(self) -> Optional[str]:
        return self.icd10_code or self.dsm5_code

    class Config:
        from_attributes = True


class TreatmentPlanCreate(BaseModel):
    patient_id: int
    therapist_id: int
    title: str
    goals: Optional[str] = None
    interventions: Optional[str] = None
    frequency: Optional[str] = None
    approach: Optional[str] = None
    start_date: date
    review_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "active"
    notes: Optional[str] = None


class TreatmentPlanUpdate(BaseModel):
    title: Optional[str] = None
    goals: Optional[str] = None
    interventions: Optional[str] = None
    frequency: Optional[str] = None
    approach: Optional[str] = None
    review_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TreatmentPlanResponse(TreatmentPlanCreate):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
