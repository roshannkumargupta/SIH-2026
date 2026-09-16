from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.dependencies import DBSession, require_doctor
from app.models.assessment import CognitiveAssessment
from app.models.relationship import DoctorPatient
from app.models.user import User, UserRole
from app.schemas.user import UserResponse


router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"],
)


@router.get("/test")
def doctor_test(
    current_user: User = Depends(require_doctor),
):
    return {
        "success": True,
        "message": "Doctor access granted",
        "user": current_user.name,
    }


@router.get("/dashboard")
def doctor_dashboard(
    db: DBSession,
    current_user: User = Depends(require_doctor),
):
    patients = db.scalars(
        select(User)
        .join(DoctorPatient, DoctorPatient.patient_id == User.id)
        .where(
            DoctorPatient.doctor_id == current_user.id,
            DoctorPatient.active.is_(True),
            User.role == UserRole.PATIENT,
            User.is_active.is_(True),
        )
    ).all()

    patient_summaries = []
    for patient in patients:
        latest_assessment = db.scalar(
            select(CognitiveAssessment)
            .where(CognitiveAssessment.patient_id == patient.id)
            .order_by(CognitiveAssessment.assessment_date.desc())
        )

        patient_summaries.append(
            {
                "patient": UserResponse.model_validate(patient),
                "latest_score": latest_assessment.overall_score if latest_assessment else None,
                "latest_score_date": latest_assessment.assessment_date if latest_assessment else None,
                "risk_level": latest_assessment.risk_level if latest_assessment else "unassessed",
            }
        )

    return {
        "patients": patient_summaries
    }


@router.get("/patients", response_model=list[UserResponse])
def doctor_patients(
    db: DBSession,
    current_user: User = Depends(require_doctor),
):
    patients = db.scalars(
        select(User)
        .join(DoctorPatient, DoctorPatient.patient_id == User.id)
        .where(
            DoctorPatient.doctor_id == current_user.id,
            DoctorPatient.active.is_(True),
            User.role == UserRole.PATIENT,
            User.is_active.is_(True),
        )
    ).all()

    return list(patients)