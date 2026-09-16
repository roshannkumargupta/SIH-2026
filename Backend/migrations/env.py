from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import settings
from app.core.database import Base
# Import all models so they are registered with Base.metadata
from app.models.assessment import CognitiveAssessment
from app.models.game import GameSession
from app.models.medication import (
    MedicationLog,
    MedicationSchedule,
)
from app.models.notification import Notification
from app.models.patient import PatientProfile
from app.models.prescription import Prescription
from app.models.relationship import (
    CaretakerPatient,
    DoctorPatient,
)
from app.models.task import Task
from app.models.user import User

config = context.config

# Give Alembic the same database URL used by the application
config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL.replace("%", "%%"),
)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.DATABASE_URL

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()