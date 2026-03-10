from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/patients", tags=["Pacientes"])

@router.get("/", response_model=List[PatientResponse])
def list_patients(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    therapist_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Patient).filter(Patient.is_active == True)
    if search:
        q = q.filter(or_(
            Patient.first_name.ilike(f"%{search}%"),
            Patient.last_name.ilike(f"%{search}%"),
            Patient.dni.ilike(f"%{search}%"),
            Patient.phone.ilike(f"%{search}%"),
            Patient.email.ilike(f"%{search}%"),
        ))
    if status:
        q = q.filter(Patient.status == status)
    if therapist_id:
        q = q.filter(Patient.therapist_id == therapist_id)
    return q.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=PatientResponse)
def create_patient(data: PatientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = Patient(**data.to_db_dict())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: int, data: PatientUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    for k, v in data.to_db_dict().items():
        setattr(patient, k, v)
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    patient.is_active = False
    db.commit()
    return {"message": "Paciente eliminado"}
