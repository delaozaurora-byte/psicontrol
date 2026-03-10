from pydantic import BaseModel, model_validator, computed_field
from typing import Optional
from datetime import date, datetime


class PatientCreate(BaseModel):
    # Accept full_name (frontend) OR first_name/last_name (direct)
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    # Accept rut_dni (frontend) OR dni
    rut_dni: Optional[str] = None
    dni: Optional[str] = None

    birth_date: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    civil_status: Optional[str] = None
    education_level: Optional[str] = None

    # Accept insurance (frontend) OR insurance_provider
    insurance: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None

    # Accept emergency_contact/emergency_phone (frontend) OR full names
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None

    referral_source: Optional[str] = None
    referred_by: Optional[str] = None
    status: str = "active"
    therapist_id: Optional[int] = None
    intake_date: Optional[date] = None
    notes: Optional[str] = None

    @model_validator(mode='after')
    def resolve_aliases(self):
        if self.full_name and not self.first_name:
            parts = self.full_name.strip().split(' ', 1)
            self.first_name = parts[0]
            self.last_name = parts[1] if len(parts) > 1 else ''
        if not self.first_name:
            self.first_name = ''
        if self.rut_dni and not self.dni:
            self.dni = self.rut_dni
        if self.insurance and not self.insurance_provider:
            self.insurance_provider = self.insurance
        if self.emergency_contact and not self.emergency_contact_name:
            self.emergency_contact_name = self.emergency_contact
        if self.emergency_phone and not self.emergency_contact_phone:
            self.emergency_contact_phone = self.emergency_phone
        return self

    def to_db_dict(self):
        return {
            'first_name': self.first_name or '',
            'last_name': self.last_name or '',
            'dni': self.dni,
            'birth_date': self.birth_date,
            'gender': self.gender,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'occupation': self.occupation,
            'civil_status': self.civil_status,
            'education_level': self.education_level,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'emergency_contact_relation': self.emergency_contact_relation,
            'insurance_provider': self.insurance_provider,
            'insurance_number': self.insurance_number,
            'referral_source': self.referral_source,
            'referred_by': self.referred_by,
            'status': self.status,
            'therapist_id': self.therapist_id,
            'intake_date': self.intake_date,
            'notes': self.notes,
        }


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    rut_dni: Optional[str] = None
    dni: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    civil_status: Optional[str] = None
    education_level: Optional[str] = None
    insurance: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    referral_source: Optional[str] = None
    referred_by: Optional[str] = None
    status: Optional[str] = None
    therapist_id: Optional[int] = None
    intake_date: Optional[date] = None
    discharge_date: Optional[date] = None
    notes: Optional[str] = None

    @model_validator(mode='after')
    def resolve_aliases(self):
        if self.full_name and not self.first_name:
            parts = self.full_name.strip().split(' ', 1)
            self.first_name = parts[0]
            self.last_name = parts[1] if len(parts) > 1 else ''
        if self.rut_dni and not self.dni:
            self.dni = self.rut_dni
        if self.insurance and not self.insurance_provider:
            self.insurance_provider = self.insurance
        if self.emergency_contact and not self.emergency_contact_name:
            self.emergency_contact_name = self.emergency_contact
        if self.emergency_phone and not self.emergency_contact_phone:
            self.emergency_contact_phone = self.emergency_phone
        return self

    def to_db_dict(self):
        result = {}
        if self.first_name is not None:
            result['first_name'] = self.first_name
        if self.last_name is not None:
            result['last_name'] = self.last_name
        for field in ['dni', 'birth_date', 'gender', 'phone', 'email', 'address',
                      'occupation', 'civil_status', 'education_level',
                      'emergency_contact_name', 'emergency_contact_phone',
                      'emergency_contact_relation', 'insurance_provider',
                      'insurance_number', 'referral_source', 'referred_by',
                      'status', 'therapist_id', 'intake_date', 'discharge_date', 'notes']:
            val = getattr(self, field)
            if val is not None:
                result[field] = val
        return result


class PatientResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    dni: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    civil_status: Optional[str] = None
    education_level: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    referral_source: Optional[str] = None
    referred_by: Optional[str] = None
    status: str = "active"
    therapist_id: Optional[int] = None
    intake_date: Optional[date] = None
    discharge_date: Optional[date] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Frontend-compatible computed fields
    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @computed_field
    @property
    def rut_dni(self) -> Optional[str]:
        return self.dni

    @computed_field
    @property
    def insurance(self) -> Optional[str]:
        return self.insurance_provider

    @computed_field
    @property
    def emergency_contact(self) -> Optional[str]:
        return self.emergency_contact_name

    @computed_field
    @property
    def emergency_phone(self) -> Optional[str]:
        return self.emergency_contact_phone

    class Config:
        from_attributes = True
