"""add hydration and appointments

Revision ID: c59d12a84b11
Revises: b41f89c021de
Create Date: 2026-09-15 23:58:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c59d12a84b11'
down_revision: Union[str, Sequence[str], None] = 'b41f89c021de'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Hydration Logs table
    op.create_table(
        'hydration_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('patient_id', sa.Uuid(), nullable=False),
        sa.Column('amount_ml', sa.Integer(), nullable=False),
        sa.Column('logged_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            'source',
            sa.Enum('MANUAL', 'CAREGIVER_LOGGED', 'REMINDER_TAP', name='hydrationsource'),
            nullable=False,
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_hydration_logs_patient_id'), 'hydration_logs', ['patient_id'], unique=False)
    op.create_index(op.f('ix_hydration_logs_logged_at'), 'hydration_logs', ['logged_at'], unique=False)

    # 2. Create Daily Hydration Goals table
    op.create_table(
        'daily_hydration_goals',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('patient_id', sa.Uuid(), nullable=False),
        sa.Column('goal_ml', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_daily_hydration_goals_patient_id'), 'daily_hydration_goals', ['patient_id'], unique=True)

    # 3. Create Appointments table
    op.create_table(
        'appointments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('patient_id', sa.Uuid(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('doctor_name', sa.String(length=150), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('appointment_datetime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column(
            'status',
            sa.Enum('SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED', name='appointmentstatus'),
            nullable=False,
        ),
        sa.Column('reminder_lead_minutes', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_appointments_patient_id'), 'appointments', ['patient_id'], unique=False)
    op.create_index(op.f('ix_appointments_created_by'), 'appointments', ['created_by'], unique=False)
    op.create_index(op.f('ix_appointments_appointment_datetime'), 'appointments', ['appointment_datetime'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_appointments_appointment_datetime'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_created_by'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_patient_id'), table_name='appointments')
    op.drop_table('appointments')

    op.drop_index(op.f('ix_daily_hydration_goals_patient_id'), table_name='daily_hydration_goals')
    op.drop_table('daily_hydration_goals')

    op.drop_index(op.f('ix_hydration_logs_logged_at'), table_name='hydration_logs')
    op.drop_index(op.f('ix_hydration_logs_patient_id'), table_name='hydration_logs')
    op.drop_table('hydration_logs')
