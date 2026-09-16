"""add mood checkins

Revision ID: d71a84f93c20
Revises: c59d12a84b11
Create Date: 2026-09-16 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd71a84f93c20'
down_revision: Union[str, Sequence[str], None] = 'c59d12a84b11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'mood_alert'")

    op.create_table(
        'mood_checkins',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('patient_id', sa.Uuid(), nullable=False),
        sa.Column(
            'mood',
            sa.Enum('HAPPY', 'CALM', 'CONFUSED', 'ANXIOUS', name='moodtype'),
            nullable=False,
        ),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_mood_checkins_patient_id'), 'mood_checkins', ['patient_id'], unique=False)
    op.create_index(op.f('ix_mood_checkins_created_at'), 'mood_checkins', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_mood_checkins_created_at'), table_name='mood_checkins')
    op.drop_index(op.f('ix_mood_checkins_patient_id'), table_name='mood_checkins')
    op.drop_table('mood_checkins')
