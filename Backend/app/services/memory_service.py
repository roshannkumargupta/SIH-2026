from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.memory import Memory
from app.schemas.memory import MemoryCreate, MemoryUpdate


def create_memory(
    db: Session,
    patient_id: UUID,
    data: MemoryCreate,
) -> Memory:
    # Auto-generate voice prompt if not provided
    voice_prompt = data.voice_prompt
    if not voice_prompt:
        voice_prompt = f"Remember this heartwarming memory: {data.title}. {data.description}"

    memory = Memory(
        patient_id=patient_id,
        title=data.title.strip(),
        category=data.category.strip() if data.category else "Family",
        description=data.description.strip(),
        date_or_era=data.date_or_era.strip() if data.date_or_era else None,
        image_url=data.image_url,
        voice_prompt=voice_prompt,
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return memory


def get_patient_memories(
    db: Session,
    patient_id: UUID,
) -> list[Memory]:
    statement = (
        select(Memory)
        .where(Memory.patient_id == patient_id)
        .order_by(Memory.created_at.desc())
    )
    return list(db.scalars(statement).all())


def get_memory(
    db: Session,
    memory_id: UUID,
) -> Memory | None:
    return db.get(Memory, memory_id)


def update_memory(
    db: Session,
    memory: Memory,
    data: MemoryUpdate,
) -> Memory:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(memory, field, value)
    db.commit()
    db.refresh(memory)
    return memory


def delete_memory(
    db: Session,
    memory: Memory,
) -> None:
    db.delete(memory)
    db.commit()
