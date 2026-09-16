"""add tasks games and assessments

Revision ID: b41f89c021de
Revises: 0889ea253c1e
Create Date: 2026-09-12 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b41f89c021de'
down_revision: Union[str, Sequence[str], None] = '0889ea253c1e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Tasks table
    op.create_table(
        'tasks',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('patient_id', sa.Uuid(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scheduled_time', sa.Time(), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'NORMAL', 'HIGH', name='taskpriority'), nullable=False),
        sa.Column('recurrence', sa.Enum('DAILY', 'WEEKLY', 'CUSTOM', name='taskrecurrence'), nullable=False),
        sa.Column('days_of_week', sa.String(length=50), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'COMPLETED', 'MISSED', name='taskstatus'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_created_by'), 'tasks', ['created_by'], unique=False)
    op.create_index(op.f('ix_tasks_patient_id'), 'tasks', ['patient_id'], unique=False)

    # 2. Create Game Sessions table
    op.create_table(
        'game_sessions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('patient_id', sa.Uuid(), nullable=False),
        sa.Column('game_type', sa.String(length=50), nullable=False),
        sa.Column('game_id', sa.String(length=100), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('accuracy', sa.Float(), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),
        sa.Column('level_achieved', sa.Integer(), nullable=False),
        sa.Column('metrics', sa.Text(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_game_sessions_patient_id'), 'game_sessions', ['patient_id'], unique=False)
    op.create_index(op.f('ix_game_sessions_game_type'), 'game_sessions', ['game_type'], unique=False)
    op.create_index(op.f('ix_game_sessions_completed_at'), 'game_sessions', ['completed_at'], unique=False)

    # 3. Create Cognitive Assessments table
    op.create_table(
        'cognitive_assessments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('patient_id', sa.Uuid(), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('risk_level', sa.String(length=20), nullable=False),
        sa.Column('memory_score', sa.Float(), nullable=False),
        sa.Column('attention_score', sa.Float(), nullable=False),
        sa.Column('executive_function_score', sa.Float(), nullable=False),
        sa.Column('language_score', sa.Float(), nullable=False),
        sa.Column('insights', sa.Text(), nullable=True),
        sa.Column('recommendations', sa.Text(), nullable=True),
        sa.Column('model_version', sa.String(length=50), nullable=False),
        sa.Column('assessment_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cognitive_assessments_patient_id'), 'cognitive_assessments', ['patient_id'], unique=False)
    op.create_index(op.f('ix_cognitive_assessments_assessment_date'), 'cognitive_assessments', ['assessment_date'], unique=False)
    op.create_index(op.f('ix_cognitive_assessments_risk_level'), 'cognitive_assessments', ['risk_level'], unique=False)

    # 4. Add unique constraints to relationship tables
    op.create_unique_constraint('uq_doctor_patient', 'doctor_patients', ['doctor_id', 'patient_id'])
    op.create_unique_constraint('uq_caretaker_patient', 'caretaker_patients', ['caretaker_id', 'patient_id'])


def downgrade() -> None:
    op.drop_constraint('uq_caretaker_patient', 'caretaker_patients', type_='unique')
    op.drop_constraint('uq_doctor_patient', 'doctor_patients', type_='unique')
    op.drop_table('cognitive_assessments')
    op.drop_table('game_sessions')
    op.drop_table('tasks')
