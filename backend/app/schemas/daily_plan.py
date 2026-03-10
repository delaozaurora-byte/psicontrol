from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ── Items ──────────────────────────────────────────────────────────────────────

class DailyPlanItemCreate(BaseModel):
    activity: str
    status: str = "pendiente"   # pendiente | completado | parcial | no_completado
    notes: Optional[str] = None
    order: int = 0


class DailyPlanItemUpdate(BaseModel):
    activity: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    order: Optional[int] = None


class DailyPlanItemResponse(BaseModel):
    id: int
    section_id: int
    activity: str
    status: str
    notes: Optional[str] = None
    order: int

    class Config:
        from_attributes = True


# ── Sections ───────────────────────────────────────────────────────────────────

class DailyPlanSectionCreate(BaseModel):
    label: str          # A, B, C…
    title: str
    order: int = 0
    items: List[DailyPlanItemCreate] = []


class DailyPlanSectionUpdate(BaseModel):
    label: Optional[str] = None
    title: Optional[str] = None
    order: Optional[int] = None


class DailyPlanSectionResponse(BaseModel):
    id: int
    plan_id: int
    label: str
    title: str
    order: int
    items: List[DailyPlanItemResponse] = []

    class Config:
        from_attributes = True


# ── Daily Plans ────────────────────────────────────────────────────────────────

class DailyPlanCreate(BaseModel):
    patient_id: int
    therapist_id: int
    plan_date: date
    title: str = "Plan Diario de Responsabilidad"
    instructions: Optional[str] = None
    status: str = "active"
    sections: List[DailyPlanSectionCreate] = []


class DailyPlanUpdate(BaseModel):
    plan_date: Optional[date] = None
    title: Optional[str] = None
    instructions: Optional[str] = None
    status: Optional[str] = None


class DailyPlanResponse(BaseModel):
    id: int
    patient_id: int
    therapist_id: int
    plan_date: date
    title: str
    instructions: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    sections: List[DailyPlanSectionResponse] = []

    class Config:
        from_attributes = True
