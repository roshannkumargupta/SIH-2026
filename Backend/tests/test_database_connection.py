import pytest
from sqlalchemy import text
from app.core.database import engine


def test_database_connection(db):
    """Verify that database operations succeed with the test database."""
    result = db.execute(text("SELECT 1"))
    assert result.scalar() == 1


def test_configured_database_connectivity():
    """Verify external configured database if available."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            assert result.scalar() == 1
    except Exception as exc:
        pytest.skip(f"Live PostgreSQL not running locally: {exc}")