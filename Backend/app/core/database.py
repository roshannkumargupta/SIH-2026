from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=not settings.DATABASE_URL.startswith("sqlite"),
)

if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Import all models and create any missing tables, with automatic column sync."""
    import app.models.user  # noqa: F401
    import app.models.patient  # noqa: F401
    import app.models.relationship  # noqa: F401
    import app.models.prescription  # noqa: F401
    import app.models.medication  # noqa: F401
    import app.models.task  # noqa: F401
    import app.models.notification  # noqa: F401
    import app.models.game  # noqa: F401
    import app.models.assessment  # noqa: F401

    import app.models.memory  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Safe column sync for existing databases
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    with engine.begin() as conn:
        if "users" in table_names:
            user_cols = {col["name"] for col in inspector.get_columns("users")}
            if "avatar_url" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT"))
            if "preferred_language" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(20) DEFAULT 'en-IN' NOT NULL"))
        if "patient_profiles" in table_names:
            patient_cols = {col["name"] for col in inspector.get_columns("patient_profiles")}
            if "gender" not in patient_cols:
                conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN gender VARCHAR(20)"))
            if "address" not in patient_cols:
                conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN address VARCHAR(255)"))
            if "doctor_name" not in patient_cols:
                conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN doctor_name VARCHAR(150)"))
            if "avatar_url" not in patient_cols:
                conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN avatar_url TEXT"))