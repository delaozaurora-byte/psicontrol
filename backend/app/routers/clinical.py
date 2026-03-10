from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.clinical import ClinicalSession, Diagnosis, TreatmentPlan
from app.schemas.clinical import (
    ClinicalSessionCreate, ClinicalSessionUpdate, ClinicalSessionResponse,
    DiagnosisCreate, DiagnosisUpdate, DiagnosisResponse,
    TreatmentPlanCreate, TreatmentPlanUpdate, TreatmentPlanResponse
)
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/clinical", tags=["Historia Clínica"])

# Sessions
@router.get("/sessions", response_model=List[ClinicalSessionResponse])
def list_sessions(patient_id: Optional[int] = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(ClinicalSession)
    if patient_id:
        q = q.filter(ClinicalSession.patient_id == patient_id)
    return q.order_by(ClinicalSession.session_date.desc()).all()

@router.post("/sessions", response_model=ClinicalSessionResponse)
def create_session(data: ClinicalSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(ClinicalSession).filter(ClinicalSession.patient_id == data.patient_id).count()
    session_data = data.model_dump()
    session_data['session_number'] = count + 1
    session = ClinicalSession(**session_data)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}", response_model=ClinicalSessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ClinicalSession).filter(ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return session

@router.put("/sessions/{session_id}", response_model=ClinicalSessionResponse)
def update_session(session_id: int, data: ClinicalSessionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ClinicalSession).filter(ClinicalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(session, k, v)
    db.commit()
    db.refresh(session)
    return session

# Diagnoses
@router.get("/diagnoses", response_model=List[DiagnosisResponse])
def list_diagnoses(patient_id: Optional[int] = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Diagnosis)
    if patient_id:
        q = q.filter(Diagnosis.patient_id == patient_id)
    return q.all()

@router.post("/diagnoses", response_model=DiagnosisResponse)
def create_diagnosis(data: DiagnosisCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    diag = Diagnosis(**data.to_db_dict())
    db.add(diag)
    db.commit()
    db.refresh(diag)
    return diag

@router.put("/diagnoses/{diag_id}", response_model=DiagnosisResponse)
def update_diagnosis(diag_id: int, data: DiagnosisUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    diag = db.query(Diagnosis).filter(Diagnosis.id == diag_id).first()
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    updates = data.model_dump(exclude_none=True)
    if 'code' in updates:
        diag.icd10_code = updates.pop('code')
    for k, v in updates.items():
        if hasattr(diag, k):
            setattr(diag, k, v)
    db.commit()
    db.refresh(diag)
    return diag

# Treatment Plans
@router.get("/treatment-plans", response_model=List[TreatmentPlanResponse])
def list_plans(patient_id: Optional[int] = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(TreatmentPlan)
    if patient_id:
        q = q.filter(TreatmentPlan.patient_id == patient_id)
    return q.all()

@router.post("/treatment-plans", response_model=TreatmentPlanResponse)
def create_plan(data: TreatmentPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = TreatmentPlan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/treatment-plans/{plan_id}", response_model=TreatmentPlanResponse)
def update_plan(plan_id: int, data: TreatmentPlanUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan de tratamiento no encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(plan, k, v)
    db.commit()
    db.refresh(plan)
    return plan
