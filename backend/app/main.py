from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.core.config import settings
from app.routers import auth, users, patients, appointments, clinical, billing, dashboard
from app.core.security import get_password_hash
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal
from app.models.user import User

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

# CORS: allow configured origins or all (for development)
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(clinical.router)
app.include_router(billing.router)
app.include_router(dashboard.router)


def run_migrations(db: Session):
    """Add new columns to existing tables if they don't exist."""
    migrations = [
        "ALTER TABLE appointments ADD COLUMN fee REAL",
        "ALTER TABLE appointments ADD COLUMN updated_at DATETIME",
        "ALTER TABLE clinical_sessions ADD COLUMN modality TEXT DEFAULT 'in_person'",
        "ALTER TABLE clinical_sessions ADD COLUMN summary TEXT",
        "ALTER TABLE diagnoses ADD COLUMN is_primary BOOLEAN DEFAULT 0",
        "ALTER TABLE diagnoses ADD COLUMN updated_at DATETIME",
        "ALTER TABLE expenses ADD COLUMN is_deductible BOOLEAN DEFAULT 0",
        "ALTER TABLE expenses ADD COLUMN updated_at DATETIME",
        "ALTER TABLE invoices ADD COLUMN updated_at DATETIME",
        "ALTER TABLE patients ADD COLUMN updated_at DATETIME",
    ]
    for sql in migrations:
        try:
            db.execute(text(sql))
        except Exception:
            pass  # Column already exists
    db.commit()


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        run_migrations(db)
        if not db.query(User).filter(User.email == "admin@centro.com").first():
            admin = User(
                email="admin@centro.com",
                full_name="Administrador",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            therapist = User(
                email="terapeuta@centro.com",
                full_name="Dra. Ana García",
                hashed_password=get_password_hash("terapeuta123"),
                role="therapist",
                specialty="Psicología Clínica",
                is_active=True
            )
            db.add(therapist)
            db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": settings.APP_NAME, "version": "1.0.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}
