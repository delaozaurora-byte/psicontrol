from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.daily_plan import DailyPlan, DailyPlanSection, DailyPlanItem
from app.schemas.daily_plan import (
    DailyPlanCreate, DailyPlanUpdate, DailyPlanResponse,
    DailyPlanSectionCreate, DailyPlanSectionUpdate, DailyPlanSectionResponse,
    DailyPlanItemCreate, DailyPlanItemUpdate, DailyPlanItemResponse,
)
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/daily-plans", tags=["Planes Diarios"])


# ── Daily Plans ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[DailyPlanResponse])
def list_daily_plans(
    patient_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(DailyPlan)
    if patient_id:
        q = q.filter(DailyPlan.patient_id == patient_id)
    return q.order_by(DailyPlan.plan_date.desc()).all()


@router.post("", response_model=DailyPlanResponse)
def create_daily_plan(
    data: DailyPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = DailyPlan(
        patient_id=data.patient_id,
        therapist_id=data.therapist_id,
        plan_date=data.plan_date,
        title=data.title,
        instructions=data.instructions,
        status=data.status,
    )
    db.add(plan)
    db.flush()  # get plan.id before adding sections

    for sec_data in data.sections:
        section = DailyPlanSection(
            plan_id=plan.id,
            label=sec_data.label,
            title=sec_data.title,
            order=sec_data.order,
        )
        db.add(section)
        db.flush()
        for item_data in sec_data.items:
            item = DailyPlanItem(
                section_id=section.id,
                activity=item_data.activity,
                status=item_data.status,
                notes=item_data.notes,
                order=item_data.order,
            )
            db.add(item)

    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=DailyPlanResponse)
def get_daily_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(DailyPlan).filter(DailyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    return plan


@router.put("/{plan_id}", response_model=DailyPlanResponse)
def update_daily_plan(
    plan_id: int,
    data: DailyPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(DailyPlan).filter(DailyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(plan, k, v)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}")
def delete_daily_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(DailyPlan).filter(DailyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    db.delete(plan)
    db.commit()
    return {"ok": True}


# ── Sections ───────────────────────────────────────────────────────────────────

@router.post("/{plan_id}/sections", response_model=DailyPlanSectionResponse)
def add_section(
    plan_id: int,
    data: DailyPlanSectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(DailyPlan).filter(DailyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    section = DailyPlanSection(
        plan_id=plan_id,
        label=data.label,
        title=data.title,
        order=data.order,
    )
    db.add(section)
    db.flush()
    for item_data in data.items:
        item = DailyPlanItem(
            section_id=section.id,
            activity=item_data.activity,
            status=item_data.status,
            notes=item_data.notes,
            order=item_data.order,
        )
        db.add(item)
    db.commit()
    db.refresh(section)
    return section


@router.put("/sections/{section_id}", response_model=DailyPlanSectionResponse)
def update_section(
    section_id: int,
    data: DailyPlanSectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    section = db.query(DailyPlanSection).filter(DailyPlanSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(section, k, v)
    db.commit()
    db.refresh(section)
    return section


@router.delete("/sections/{section_id}")
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    section = db.query(DailyPlanSection).filter(DailyPlanSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    db.delete(section)
    db.commit()
    return {"ok": True}


# ── Items ──────────────────────────────────────────────────────────────────────

@router.post("/sections/{section_id}/items", response_model=DailyPlanItemResponse)
def add_item(
    section_id: int,
    data: DailyPlanItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    section = db.query(DailyPlanSection).filter(DailyPlanSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    item = DailyPlanItem(
        section_id=section_id,
        activity=data.activity,
        status=data.status,
        notes=data.notes,
        order=data.order,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=DailyPlanItemResponse)
def update_item(
    item_id: int,
    data: DailyPlanItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(DailyPlanItem).filter(DailyPlanItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(DailyPlanItem).filter(DailyPlanItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    db.delete(item)
    db.commit()
    return {"ok": True}
