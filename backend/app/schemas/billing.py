from pydantic import BaseModel, computed_field
from typing import Optional, List
from datetime import datetime, date


class InvoiceItemCreate(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    # Accept subtotal (frontend) OR total (direct)
    subtotal: Optional[float] = None
    total: Optional[float] = None

    def get_total(self) -> float:
        if self.total is not None:
            return self.total
        if self.subtotal is not None:
            return self.subtotal
        return self.quantity * self.unit_price


class InvoiceItemResponse(BaseModel):
    id: int
    description: str
    quantity: float
    unit_price: float
    total: float

    @computed_field
    @property
    def subtotal(self) -> float:
        return self.total

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    patient_id: int
    therapist_id: Optional[int] = None
    appointment_id: Optional[int] = None
    issue_date: date
    due_date: Optional[date] = None
    discount: float = 0.0
    tax: float = 0.0
    status: str = "draft"
    payment_method: Optional[str] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[InvoiceItemCreate] = []


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    payment_date: Optional[date] = None
    due_date: Optional[date] = None
    discount: Optional[float] = None
    tax: Optional[float] = None
    notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    patient_id: int
    therapist_id: Optional[int] = None
    appointment_id: Optional[int] = None
    issue_date: date
    due_date: Optional[date] = None
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    total: float
    status: str
    payment_method: Optional[str] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    category: str
    description: str
    amount: float
    # Accept expense_date (frontend) OR date (direct)
    expense_date: Optional[date] = None
    date: Optional[date] = None
    is_deductible: bool = False
    payment_method: Optional[str] = None
    notes: Optional[str] = None

    def get_date(self) -> date:
        return self.expense_date or self.date or date.today()


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    expense_date: Optional[date] = None
    date: Optional[date] = None
    is_deductible: Optional[bool] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    category: str
    description: str
    amount: float
    expense_date: date
    is_deductible: bool = False
    receipt_url: Optional[str] = None
    created_by_id: Optional[int] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
