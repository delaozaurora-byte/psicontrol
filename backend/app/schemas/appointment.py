from pydantic import BaseModel, model_validator, computed_field
from typing import Optional
from datetime import datetime
from app.schemas.patient import PatientResponse
from app.schemas.user import UserResponse


class AppointmentCreate(BaseModel):
    patient_id: int
    therapist_id: int
    start_time: datetime
    end_time: datetime
    # Accept appointment_type (frontend) OR type (direct)
    appointment_type: Optional[str] = None
    type: Optional[str] = None
    status: str = "scheduled"
    modality: str = "presencial"
    room: Optional[str] = None
    fee: Optional[float] = None
    notes: Optional[str] = None

    @model_validator(mode='after')
    def resolve_type(self):
        if self.appointment_type and not self.type:
            self.type = self.appointment_type
        if not self.type:
            self.type = "followup"
        return self

    def to_db_dict(self):
        return {
            'patient_id': self.patient_id,
            'therapist_id': self.therapist_id,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'type': self.type,
            'status': self.status,
            'modality': self.modality,
            'room': self.room,
            'fee': self.fee,
            'notes': self.notes,
        }


class AppointmentUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    appointment_type: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    modality: Optional[str] = None
    room: Optional[str] = None
    fee: Optional[float] = None
    notes: Optional[str] = None

    @model_validator(mode='after')
    def resolve_type(self):
        if self.appointment_type and not self.type:
            self.type = self.appointment_type
        return self

    def to_db_dict(self):
        result = {}
        for field in ['start_time', 'end_time', 'type', 'status', 'modality', 'room', 'fee', 'notes']:
            val = getattr(self, field)
            if val is not None:
                result[field] = val
        return result


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    therapist_id: int
    start_time: datetime
    end_time: datetime
    type: str
    status: str
    modality: str
    room: Optional[str] = None
    fee: Optional[float] = None
    notes: Optional[str] = None
    reminder_sent: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    patient: Optional[PatientResponse] = None
    therapist: Optional[UserResponse] = None

    @computed_field
    @property
    def appointment_type(self) -> str:
        return self.type

    class Config:
        from_attributes = True
