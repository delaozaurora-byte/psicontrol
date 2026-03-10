from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.billing import Invoice
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def get_dashboard_data(db: Session):
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    total_patients = db.query(Patient).filter(Patient.is_active == True).count()
    active_patients = db.query(Patient).filter(Patient.status == "active", Patient.is_active == True).count()

    today_appointments = db.query(Appointment).filter(
        func.date(Appointment.start_time) == today
    ).count()

    week_appointments = db.query(Appointment).filter(
        Appointment.start_time >= week_start,
        Appointment.start_time <= week_end,
        Appointment.status != "cancelled"
    ).count()

    pending_invoices_amount = db.query(func.sum(Invoice.total)).filter(
        Invoice.status.in_(["sent", "draft"])
    ).scalar() or 0

    pending_invoices_count = db.query(Invoice).filter(
        Invoice.status.in_(["sent", "draft"])
    ).count()

    month_start = today.replace(day=1)
    monthly_income = db.query(func.sum(Invoice.total)).filter(
        Invoice.status == "paid",
        Invoice.payment_date >= month_start
    ).scalar() or 0

    upcoming = db.query(Appointment).filter(
        Appointment.start_time >= datetime.now(),
        Appointment.start_time <= datetime.now() + timedelta(hours=8),
        Appointment.status.in_(["scheduled", "confirmed"])
    ).order_by(Appointment.start_time).limit(5).all()

    recent_patients = db.query(Patient).filter(
        Patient.is_active == True
    ).order_by(Patient.created_at.desc()).limit(5).all()

    upcoming_list = [
        {
            "id": a.id,
            "start_time": a.start_time.isoformat(),
            "end_time": a.end_time.isoformat(),
            "status": a.status,
            "type": a.type,
            "appointment_type": a.type,
            "patient_id": a.patient_id,
            "therapist_id": a.therapist_id,
            "modality": a.modality,
            "created_at": a.created_at.isoformat(),
        } for a in upcoming
    ]

    recent_patients_list = [
        {
            "id": p.id,
            "full_name": f"{p.first_name} {p.last_name}".strip(),
            "first_name": p.first_name,
            "last_name": p.last_name,
            "email": p.email,
            "phone": p.phone,
            "status": p.status,
            "is_active": p.is_active,
            "created_at": p.created_at.isoformat(),
        } for p in recent_patients
    ]

    return {
        "total_patients": total_patients,
        "active_patients": active_patients,
        "today_appointments": today_appointments,
        "todays_appointments": today_appointments,
        "week_appointments": week_appointments,
        "pending_invoices_amount": pending_invoices_amount,
        "pending_invoices": pending_invoices_count,
        "monthly_income": monthly_income,
        "upcoming_appointments": upcoming_list,
        "recent_patients": recent_patients_list,
    }

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_dashboard_data(db)

@router.get("/")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_dashboard_data(db)
