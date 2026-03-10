from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_date = Column(Date, nullable=False)
    title = Column(String, nullable=False, default="Plan Diario de Responsabilidad")
    instructions = Column(Text, nullable=True)
    status = Column(String, default="active")  # active, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="daily_plans")
    therapist = relationship("User", back_populates="daily_plans")
    sections = relationship("DailyPlanSection", back_populates="plan",
                            cascade="all, delete-orphan", order_by="DailyPlanSection.order")


class DailyPlanSection(Base):
    __tablename__ = "daily_plan_sections"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("daily_plans.id"), nullable=False)
    label = Column(String, nullable=False)   # A, B, C...
    title = Column(String, nullable=False)   # "Mañana antes de irme"
    order = Column(Integer, default=0)

    plan = relationship("DailyPlan", back_populates="sections")
    items = relationship("DailyPlanItem", back_populates="section",
                         cascade="all, delete-orphan", order_by="DailyPlanItem.order")


class DailyPlanItem(Base):
    __tablename__ = "daily_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("daily_plan_sections.id"), nullable=False)
    activity = Column(String, nullable=False)
    # pendiente | completado | parcial | no_completado
    status = Column(String, default="pendiente")
    notes = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    section = relationship("DailyPlanSection", back_populates="items")
