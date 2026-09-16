from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DoctorPatientCreate(BaseModel):
    doctor_id: UUID
    patient_id: UUID


class CaretakerPatientCreate(BaseModel):
    caretaker_id: UUID
    patient_id: UUID
    relationship_type: str | None = None


class DoctorPatientResponse(BaseModel):
    id: UUID
    doctor_id: UUID
    patient_id: UUID
    active: bool

    model_config = ConfigDict(from_attributes=True)


class CaretakerPatientResponse(BaseModel):
    id: UUID
    caretaker_id: UUID
    patient_id: UUID
    relationship_type: str | None
    active: bool

    model_config = ConfigDict(from_attributes=True)