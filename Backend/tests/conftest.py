import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.patient import PatientProfile
from app.models.relationship import CaretakerPatient, DoctorPatient
from app.models.user import User, UserRole

# In-memory SQLite engine for self-contained, high-speed test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def patient_user(db):
    user = User(
        name="John Doe",
        email="patient@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.PATIENT,
        phone="9876543210",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = PatientProfile(
        user_id=user.id,
        preferred_language="en",
        timezone="Asia/Kolkata",
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    token = create_access_token(user.id)
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="function")
def doctor_user(db):
    user = User(
        name="Dr. Smith",
        email="doctor@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.DOCTOR,
        phone="9876543211",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="function")
def caretaker_user(db):
    user = User(
        name="Sarah Caretaker",
        email="caretaker@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.CARETAKER,
        phone="9876543212",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="function")
def admin_user(db):
    user = User(
        name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.ADMIN,
        phone="9876543213",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="function")
def setup_relationships(db, patient_user, doctor_user, caretaker_user):
    doc_rel = DoctorPatient(
        doctor_id=doctor_user["user"].id,
        patient_id=patient_user["user"].id,
        active=True,
    )
    care_rel = CaretakerPatient(
        caretaker_id=caretaker_user["user"].id,
        patient_id=patient_user["user"].id,
        relationship_type="primary_caregiver",
        active=True,
    )
    db.add(doc_rel)
    db.add(care_rel)
    db.commit()
