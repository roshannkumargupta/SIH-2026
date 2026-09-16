import sys
import os
from datetime import date, datetime, time, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, init_db
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.models.relationship import DoctorPatient, CaretakerPatient
from app.models.prescription import Prescription, PrescriptionStatus
from app.models.medication import MedicationSchedule, MedicationLog, MedicationFrequency, MedicationLogStatus
from app.models.task import Task, TaskPriority, TaskRecurrence, TaskStatus
from app.models.game import GameSession
from app.models.assessment import CognitiveAssessment
from app.models.notification import Notification, NotificationType, NotificationStatus


def seed_data():
    init_db()
    db = SessionLocal()
    try:
        print("🌱 Seeding clinical demo data...")

        # 1. Patient: Lalita Devi
        lalita = db.query(User).filter_by(email="lalita@smritisetu.com").first()
        if not lalita:
            lalita = User(
                name="Lalita Devi",
                email="lalita@smritisetu.com",
                password_hash=hash_password("Password123!"),
                role=UserRole.PATIENT,
                phone="+91 98765 12345",
                is_active=True,
            )
            db.add(lalita)
            db.flush()

            patient_profile = PatientProfile(
                user_id=lalita.id,
                date_of_birth=date(1954, 4, 15),
                emergency_contact_name="Rahul Verma (Son)",
                emergency_contact_phone="+91 98765 43210",
                preferred_language="en",
                timezone="Asia/Kolkata",
            )
            db.add(patient_profile)
            print("  ✓ Created Patient: Lalita Devi (lalita@smritisetu.com / Password123!)")

        # 2. Caregiver: Rahul Verma
        rahul = db.query(User).filter_by(email="caregiver@smritisetu.com").first()
        if not rahul:
            rahul = User(
                name="Rahul Verma",
                email="caregiver@smritisetu.com",
                password_hash=hash_password("Password123!"),
                role=UserRole.CARETAKER,
                phone="+91 98765 43210",
                is_active=True,
            )
            db.add(rahul)
            db.flush()
            print("  ✓ Created Caregiver: Rahul Verma (caregiver@smritisetu.com / Password123!)")

        # 3. Doctor: Dr. Ananya Sharma
        doctor = db.query(User).filter_by(email="doctor@smritisetu.com").first()
        if not doctor:
            doctor = User(
                name="Dr. Ananya Sharma",
                email="doctor@smritisetu.com",
                password_hash=hash_password("Password123!"),
                role=UserRole.DOCTOR,
                phone="+91 91234 56789",
                is_active=True,
            )
            db.add(doctor)
            db.flush()
            print("  ✓ Created Doctor: Dr. Ananya Sharma (doctor@smritisetu.com / Password123!)")

        # Relationships
        doc_rel = db.query(DoctorPatient).filter_by(doctor_id=doctor.id, patient_id=lalita.id).first()
        if not doc_rel:
            doc_rel = DoctorPatient(doctor_id=doctor.id, patient_id=lalita.id, relationship_type="Primary Neurologist", active=True)
            db.add(doc_rel)

        care_rel = db.query(CaretakerPatient).filter_by(caretaker_id=rahul.id, patient_id=lalita.id).first()
        if not care_rel:
            care_rel = CaretakerPatient(caretaker_id=rahul.id, patient_id=lalita.id, relationship_type="Son / Primary Caregiver", active=True)
            db.add(care_rel)

        # Prescriptions
        rx1 = db.query(Prescription).filter_by(patient_id=lalita.id, medicine_name="Donepezil").first()
        if not rx1:
            rx1 = Prescription(
                patient_id=lalita.id,
                doctor_id=doctor.id,
                medicine_name="Donepezil",
                dosage="5mg",
                route="Oral",
                instructions="1 tablet daily in the morning after breakfast",
                start_date=date.today() - timedelta(days=30),
                status=PrescriptionStatus.ACTIVE,
            )
            db.add(rx1)
            db.flush()

        rx2 = db.query(Prescription).filter_by(patient_id=lalita.id, medicine_name="Memantine").first()
        if not rx2:
            rx2 = Prescription(
                patient_id=lalita.id,
                doctor_id=doctor.id,
                medicine_name="Memantine",
                dosage="10mg",
                route="Oral",
                instructions="1 tablet in the evening before sleep",
                start_date=date.today() - timedelta(days=20),
                status=PrescriptionStatus.ACTIVE,
            )
            db.add(rx2)
            db.flush()

        # Medication Schedules
        sched1 = db.query(MedicationSchedule).filter_by(patient_id=lalita.id, medicine_name="Donepezil").first()
        if not sched1:
            sched1 = MedicationSchedule(
                prescription_id=rx1.id,
                patient_id=lalita.id,
                medicine_name="Donepezil",
                dosage="5mg - 1 tablet",
                scheduled_time=time(10, 0),
                frequency=MedicationFrequency.DAILY,
                start_date=date.today() - timedelta(days=30),
                active=True,
                reminder_enabled=True,
            )
            db.add(sched1)
            db.flush()

        sched2 = db.query(MedicationSchedule).filter_by(patient_id=lalita.id, medicine_name="Memantine").first()
        if not sched2:
            sched2 = MedicationSchedule(
                prescription_id=rx2.id,
                patient_id=lalita.id,
                medicine_name="Memantine",
                dosage="10mg - 1 tablet",
                scheduled_time=time(20, 0),
                frequency=MedicationFrequency.DAILY,
                start_date=date.today() - timedelta(days=20),
                active=True,
                reminder_enabled=True,
            )
            db.add(sched2)
            db.flush()

        # Today's Medication Logs
        today_start = datetime.combine(date.today(), time(0, 0), tzinfo=timezone.utc)
        today_log1 = db.query(MedicationLog).filter_by(schedule_id=sched1.id).filter(MedicationLog.scheduled_at >= today_start).first()
        if not today_log1:
            today_log1 = MedicationLog(
                schedule_id=sched1.id,
                patient_id=lalita.id,
                scheduled_at=datetime.combine(date.today(), time(10, 0), tzinfo=timezone.utc),
                status=MedicationLogStatus.SCHEDULED,
            )
            db.add(today_log1)

        today_log2 = db.query(MedicationLog).filter_by(schedule_id=sched2.id).filter(MedicationLog.scheduled_at >= today_start).first()
        if not today_log2:
            today_log2 = MedicationLog(
                schedule_id=sched2.id,
                patient_id=lalita.id,
                scheduled_at=datetime.combine(date.today(), time(20, 0), tzinfo=timezone.utc),
                status=MedicationLogStatus.SCHEDULED,
            )
            db.add(today_log2)

        # Tasks for today
        task_list = [
            ("Breakfast", "Healthy breakfast with warm oats & almonds", time(8, 0), TaskPriority.NORMAL, TaskStatus.COMPLETED),
            ("Morning walk", "Gentle 15-minute walk in the backyard garden", time(9, 0), TaskPriority.HIGH, TaskStatus.PENDING),
            ("Lunch", "Warm khichdi or soup with vegetables", time(13, 0), TaskPriority.NORMAL, TaskStatus.PENDING),
            ("Medicine", "Take 10:00 AM prescribed medication", time(14, 0), TaskPriority.HIGH, TaskStatus.PENDING),
            ("Rest", "Relaxing afternoon nap or quiet reading", time(15, 30), TaskPriority.LOW, TaskStatus.PENDING),
        ]
        for title, desc, t, priority, status in task_list:
            existing = db.query(Task).filter_by(patient_id=lalita.id, title=title, start_date=date.today()).first()
            if not existing:
                t_obj = Task(
                    patient_id=lalita.id,
                    created_by=rahul.id,
                    title=title,
                    description=desc,
                    scheduled_time=t,
                    priority=priority,
                    recurrence=TaskRecurrence.DAILY,
                    start_date=date.today(),
                    status=status,
                    completed_at=datetime.now(timezone.utc) if status == TaskStatus.COMPLETED else None,
                )
                db.add(t_obj)

        # Games sessions
        if db.query(GameSession).filter_by(patient_id=lalita.id).count() == 0:
            for i in range(5):
                db.add(GameSession(
                    patient_id=lalita.id,
                    game_type="memory_match",
                    game_id="memory_match",
                    score=80 + i * 3,
                    accuracy=85.0 + i * 2.5,
                    duration_seconds=45 - i * 3,
                    difficulty="medium",
                    level_achieved=1 + i,
                    completed_at=datetime.now(timezone.utc) - timedelta(days=i),
                ))

        # Cognitive Assessment
        if db.query(CognitiveAssessment).filter_by(patient_id=lalita.id).count() == 0:
            db.add(CognitiveAssessment(
                patient_id=lalita.id,
                overall_score=83.5,
                risk_level="low",
                memory_score=85.0,
                attention_score=82.0,
                executive_function_score=81.0,
                language_score=86.0,
                insights="Short-term recall and daily sequence attention remain stable with consistent medication adherence.",
                recommendations="Continue daily Memory Match challenge and maintain morning garden walks.",
                model_version="v1.2-hybrid-clinical",
                assessment_date=datetime.now(timezone.utc),
            ))

        # Notifications
        if db.query(Notification).filter_by(patient_id=lalita.id).count() == 0:
            db.add(Notification(
                patient_id=lalita.id,
                type=NotificationType.MEDICATION,
                title="Medication Due at 10:00 AM",
                message="Please take your Donepezil (5mg) after breakfast.",
                scheduled_for=datetime.combine(date.today(), time(10, 0), tzinfo=timezone.utc),
                status=NotificationStatus.PENDING,
            ))
            db.add(Notification(
                patient_id=lalita.id,
                type=NotificationType.TASK,
                title="Morning Routine Reminder",
                message="Time for a refreshing walk in the garden.",
                scheduled_for=datetime.combine(date.today(), time(9, 0), tzinfo=timezone.utc),
                status=NotificationStatus.READ,
            ))

        db.commit()
        print("✅ Demo clinical data seeded successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
