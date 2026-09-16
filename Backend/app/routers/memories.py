from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import DBSession, get_current_user
from app.models.user import User, UserRole
from app.schemas.memory import MemoryCreate, MemoryResponse, MemoryUpdate
from app.services.memory_service import (
    create_memory,
    delete_memory,
    get_memory,
    get_patient_memories,
    update_memory,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)

router = APIRouter(
    prefix="/memories",
    tags=["Memories"],
)


def verify_patient_access(
    db,
    current_user: User,
    patient_id: UUID,
):
    if current_user.role == UserRole.ADMIN:
        return

    if current_user.role == UserRole.PATIENT:
        if current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own memories",
            )
        return

    if current_user.role == UserRole.CARETAKER:
        if not caretaker_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caretaker is not assigned to this patient",
            )
        return

    if current_user.role == UserRole.DOCTOR:
        if not doctor_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor is not assigned to this patient",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access memories",
    )


@router.get(
    "",
    response_model=list[MemoryResponse],
    summary="List memories for current authenticated patient",
)
def list_my_memories(
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    return get_patient_memories(db, current_user.id)


@router.post(
    "",
    response_model=MemoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new memory for current authenticated patient",
)
def add_new_memory(
    data: MemoryCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    return create_memory(db, current_user.id, data)


@router.get(
    "/patient/{patient_id}",
    response_model=list[MemoryResponse],
    summary="List memories for a specific patient",
)
def list_patient_memories(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(db, current_user, patient_id)
    return get_patient_memories(db, patient_id)


@router.post(
    "/patient/{patient_id}",
    response_model=MemoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new memory for a specific patient (caregiver/doctor/admin)",
)
def add_patient_memory(
    patient_id: UUID,
    data: MemoryCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(db, current_user, patient_id)
    return create_memory(db, patient_id, data)


@router.delete(
    "/{memory_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a memory",
)
def remove_memory(
    memory_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    memory = get_memory(db, memory_id)
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found",
        )

    verify_patient_access(db, current_user, memory.patient_id)
    delete_memory(db, memory)
    return {"success": True, "message": "Memory deleted successfully."}
