from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.billing import Invoice, InvoiceItem, Expense
from app.schemas.billing import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse,
    ExpenseCreate, ExpenseUpdate, ExpenseResponse
)
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/billing", tags=["Facturación"])

def generate_invoice_number(db: Session) -> str:
    count = db.query(Invoice).count()
    from datetime import datetime
    year = datetime.now().year
    return f"FAC-{year}-{count + 1:04d}"

@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(
    patient_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Invoice)
    if patient_id:
        q = q.filter(Invoice.patient_id == patient_id)
    if status:
        q = q.filter(Invoice.status == status)
    return q.order_by(Invoice.issue_date.desc()).offset(skip).limit(limit).all()

@router.post("/invoices", response_model=InvoiceResponse)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items_data = data.items
    subtotal = sum(item.get_total() for item in items_data)
    total = subtotal - data.discount + data.tax
    invoice = Invoice(
        patient_id=data.patient_id,
        therapist_id=data.therapist_id,
        appointment_id=data.appointment_id,
        issue_date=data.issue_date,
        due_date=data.due_date,
        discount=data.discount,
        tax=data.tax,
        status=data.status,
        payment_method=data.payment_method,
        payment_date=data.payment_date,
        notes=data.notes,
        invoice_number=generate_invoice_number(db),
        subtotal=subtotal,
        total=total
    )
    db.add(invoice)
    db.flush()
    for item in items_data:
        db.add(InvoiceItem(
            invoice_id=invoice.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item.get_total()
        ))
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return inv

@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: int, data: InvoiceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(inv, k, v)
    db.commit()
    db.refresh(inv)
    return inv

# Expenses
@router.get("/expenses", response_model=List[ExpenseResponse])
def list_expenses(
    category: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Expense)
    if category:
        q = q.filter(Expense.category == category)
    if start_date:
        q = q.filter(Expense.date >= start_date)
    if end_date:
        q = q.filter(Expense.date <= end_date)
    return q.order_by(Expense.date.desc()).offset(skip).limit(limit).all()

@router.post("/expenses", response_model=ExpenseResponse)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exp = Expense(
        category=data.category,
        description=data.description,
        amount=data.amount,
        date=data.get_date(),
        is_deductible=data.is_deductible,
        payment_method=data.payment_method,
        notes=data.notes,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

@router.put("/expenses/{exp_id}", response_model=ExpenseResponse)
def update_expense(exp_id: int, data: ExpenseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exp = db.query(Expense).filter(Expense.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    updates = data.model_dump(exclude_none=True)
    if 'expense_date' in updates:
        exp.date = updates.pop('expense_date')
    if 'date' in updates:
        exp.date = updates.pop('date')
    for k, v in updates.items():
        if hasattr(exp, k):
            setattr(exp, k, v)
    db.commit()
    db.refresh(exp)
    return exp

@router.delete("/expenses/{exp_id}")
def delete_expense(exp_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exp = db.query(Expense).filter(Expense.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    db.delete(exp)
    db.commit()
    return {"message": "Gasto eliminado"}

@router.get("/summary")
def get_financial_summary(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime
    current_year = year or datetime.now().year
    inv_q = db.query(func.sum(Invoice.total)).filter(
        Invoice.status == "paid",
        extract("year", Invoice.issue_date) == current_year
    )
    exp_q = db.query(func.sum(Expense.amount)).filter(
        extract("year", Expense.date) == current_year
    )
    pending_q = db.query(func.sum(Invoice.total)).filter(
        Invoice.status.in_(["sent", "draft"]),
        extract("year", Invoice.issue_date) == current_year
    )
    invoiced_q = db.query(func.sum(Invoice.total)).filter(
        extract("year", Invoice.issue_date) == current_year
    )
    if month:
        inv_q = inv_q.filter(extract("month", Invoice.issue_date) == month)
        exp_q = exp_q.filter(extract("month", Expense.date) == month)
        pending_q = pending_q.filter(extract("month", Invoice.issue_date) == month)
        invoiced_q = invoiced_q.filter(extract("month", Invoice.issue_date) == month)

    total_paid = inv_q.scalar() or 0
    total_expenses = exp_q.scalar() or 0
    total_pending = pending_q.scalar() or 0
    total_invoiced = invoiced_q.scalar() or 0

    return {
        "year": current_year,
        "month": month,
        "total_invoiced": total_invoiced,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "total_expenses": total_expenses,
        "net_income": total_paid - total_expenses,
        "total_income": total_paid,
        "net_profit": total_paid - total_expenses,
        "pending_invoices": total_pending,
    }
