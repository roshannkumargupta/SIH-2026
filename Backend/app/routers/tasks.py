from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import (
    DBSession,
    get_current_user,
)
from app.models.task import TaskStatus
from app.models.user import User, UserRole
from app.schemas.task import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)
from app.services.task_service import (
    complete_task,
    create_task,
    delete_task,
    get_patient_tasks,
    get_task,
    reset_task,
    update_task,
)


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
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
                detail="You can only access your own tasks",
            )
        return

    if current_user.role == UserRole.DOCTOR:
        if not doctor_has_patient_access(
            db,
            current_user.id,
            patient_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor is not assigned to this patient",
            )
        return

    if current_user.role == UserRole.CARETAKER:
        if not caretaker_has_patient_access(
            db,
            current_user.id,
            patient_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caretaker is not assigned to this patient",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have task access",
    )


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_task(
    data: TaskCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (
        UserRole.DOCTOR,
        UserRole.CARETAKER,
        UserRole.PATIENT,
        UserRole.ADMIN,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to create tasks",
        )

    if current_user.role == UserRole.PATIENT and data.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patients can only create routines for themselves",
        )

    verify_patient_access(
        db,
        current_user,
        data.patient_id,
    )

    return create_task(
        db,
        current_user,
        data,
    )


@router.get(
    "/patient/{patient_id}",
    response_model=list[TaskResponse],
)
def list_patient_tasks(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(
        db,
        current_user,
        patient_id,
    )

    return get_patient_tasks(
        db,
        patient_id,
    )


@router.get(
    "/patient/{patient_id}/today",
    response_model=list[TaskResponse],
)
def list_today_tasks(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(
        db,
        current_user,
        patient_id,
    )

    return get_patient_tasks(
        db,
        patient_id,
        date.today(),
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_single_task(
    task_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    task = get_task(
        db,
        task_id,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    verify_patient_access(
        db,
        current_user,
        task.patient_id,
    )

    return task


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
)
def update_existing_task(
    task_id: UUID,
    data: TaskUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    task = get_task(
        db,
        task_id,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    verify_patient_access(
        db,
        current_user,
        task.patient_id,
    )

    if current_user.role not in (
        UserRole.DOCTOR,
        UserRole.CARETAKER,
        UserRole.PATIENT,
        UserRole.ADMIN,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to update tasks",
        )

    return update_task(
        db,
        task,
        data,
    )


@router.post(
    "/{task_id}/complete",
    response_model=TaskResponse,
)
def complete_existing_task(
    task_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    task = get_task(
        db,
        task_id,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    verify_patient_access(
        db,
        current_user,
        task.patient_id,
    )

    if current_user.role not in (
        UserRole.PATIENT,
        UserRole.CARETAKER,
        UserRole.DOCTOR,
        UserRole.ADMIN,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to complete task",
        )

    return complete_task(
        db,
        task,
    )


@router.post(
    "/{task_id}/reset",
    response_model=TaskResponse,
)
def reset_existing_task(
    task_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    task = get_task(
        db,
        task_id,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    verify_patient_access(
        db,
        current_user,
        task.patient_id,
    )

    if current_user.role not in (
        UserRole.DOCTOR,
        UserRole.CARETAKER,
        UserRole.PATIENT,
        UserRole.ADMIN,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to reset tasks",
        )

    return reset_task(
        db,
        task,
    )


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_task(
    task_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    task = get_task(
        db,
        task_id,
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    verify_patient_access(
        db,
        current_user,
        task.patient_id,
    )

    if current_user.role not in (
        UserRole.DOCTOR,
        UserRole.CARETAKER,
        UserRole.PATIENT,
        UserRole.ADMIN,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to delete tasks",
        )

    delete_task(
        db,
        task,
    )

    return None