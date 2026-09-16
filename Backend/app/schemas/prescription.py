from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.prescription import PrescriptionStatus


class PrescriptionCreate(BaseModel):
    patient_id: UUID

    medicine_name: str = Field(
        min_length=1,
        max_length=150,
    )

    dosage: str = Field(
        min_length=1,
        max_length=100,
    )

    route: str | None = Field(
        default=None,
        max_length=50,
    )

    instructions: str | None = None

    start_date: date

    end_date: date | None = None

    notes: str | None = None


class PrescriptionUpdate(BaseModel):
    medicine_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    dosage: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    route: str | None = Field(
        default=None,
        max_length=50,
    )

    instructions: str | None = None

    start_date: date | None = None

    end_date: date | None = None

    notes: str | None = None

    status: PrescriptionStatus | None = None


class PrescriptionResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    medicine_name: str
    dosage: str
    route: str | None
    instructions: str | None
    start_date: date
    end_date: date | None
    notes: str | None
    status: PrescriptionStatus

    model_config = ConfigDict(
        from_attributes=True
    )