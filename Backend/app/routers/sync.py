from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import DBSession, get_current_user
from app.models.user import User, UserRole
from app.schemas.sync import SyncBatchRequest, SyncBatchResponse
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)
from app.services.sync_service import process_offline_sync

router = APIRouter(
    prefix="/sync",
    tags=["Offline Synchronization"],
)


@router.post("", response_model=SyncBatchResponse)
def batch_sync(
    data: SyncBatchRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """
    Sync offline data (games, medication logs, and tasks) recorded on the client device.
    Supports idempotency and resolves conflict without crashing.
    """
    patient_id = data.patient_id or current_user.id

    if current_user.role == UserRole.PATIENT and patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patients can only sync their own data",
        )

    if current_user.role == UserRole.CARETAKER:
        if not caretaker_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caretaker is not assigned to this patient",
            )

    if current_user.role == UserRole.DOCTOR:
        if not doctor_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor is not assigned to this patient",
            )

    try:
        return process_offline_sync(
            db=db,
            patient_id=patient_id,
            data=data,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Synchronization failed: {str(exc)}",
        )
