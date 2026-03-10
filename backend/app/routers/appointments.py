from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/appointments", tags=["Citas"])

@router.get("/", response_model=List[AppointmentResponse])
def list_appointments(
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    therapist_id: Optional[int] = Query(None),
    patient_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Appointment).options(joinedload(Appointment.patient), joinedload(Appointment.therapist))
    if start:
        q = q.filter(Appointment.start_time >= start)
    elif start_date:
        q = q.filter(Appointment.start_time >= start_date)
    if end:
        q = q.filter(Appointment.end_time <= end)
    elif end_date:
        q = q.filter(Appointment.start_time <= end_date)
    if therapist_id:
        q = q.filter(Appointment.therapist_id == therapist_id)
    if patient_id:
        q = q.filter(Appointment.patient_id == patient_id)
    if status:
        q = q.filter(Appointment.status == status)
    return q.order_by(Appointment.start_time).all()

@router.post("/", response_model=AppointmentResponse)
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appt = Appointment(**data.to_db_dict())
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return db.query(Appointment).options(joinedload(Appointment.patient), joinedload(Appointment.therapist)).filter(Appointment.id == appt.id).first()

@router.get("/{appt_id}", response_model=AppointmentResponse)
def get_appointment(appt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appt = db.query(Appointment).options(joinedload(Appointment.patient), joinedload(Appointment.therapist)).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return appt

@router.put("/{appt_id}", response_model=AppointmentResponse)
def update_appointment(appt_id: int, data: AppointmentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    for k, v in data.to_db_dict().items():
        setattr(appt, k, v)
    db.commit()
    db.refresh(appt)
    return db.query(Appointment).options(joinedload(Appointment.patient), joinedload(Appointment.therapist)).filter(Appointment.id == appt_id).first()

@router.delete("/{appt_id}")
def cancel_appointment(appt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    appt.status = "cancelled"
    db.commit()
    return {"message": "Cita cancelada"}
