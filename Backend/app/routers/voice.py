from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status

from app.core.dependencies import DBSession, get_current_user_optional
from app.models.task import Task, TaskStatus
from app.models.user import User, UserRole
from app.schemas.voice import (
    SynthesizeRequest,
    SynthesizeResponse,
    TranscribeRequest,
    TranscribeResponse,
    InterpretRequest,
    InterpretResponse,
    VoiceLanguage,
)
from app.services.voice_service import (
    get_supported_voice_languages,
    interpret_user_text,
    synthesize_speech_payload,
    transcribe_audio_bytes,
    transcribe_audio_payload,
)

router = APIRouter(
    prefix="/voice",
    tags=["Voice & Speech"],
)


@router.get("/languages", response_model=list[VoiceLanguage])
def list_voice_languages():
    """List supported voice recognition and synthesis languages."""
    return get_supported_voice_languages()


@router.post("/interpret", response_model=InterpretResponse)
def interpret_command_endpoint(data: InterpretRequest):
    """Interpret transcribed speech or typed commands into structured intent."""
    try:
        return interpret_user_text(text=data.text, language=data.language)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Interpretation failed: {exc}",
        )


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio_unified(request: Request):
    """Transcribe audio sent either as JSON (base64) or multipart/form-data."""
    content_type = request.headers.get("content-type", "").lower()

    if "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file_field = form.get("file") or form.get("audio")
            language_code = str(form.get("language_code") or form.get("language") or "en-IN")

            if file_field and hasattr(file_field, "read"):
                contents = await file_field.read()
                filename = getattr(file_field, "filename", "voice.webm") or "voice.webm"
                return transcribe_audio_bytes(
                    audio_bytes=contents,
                    language_code=language_code,
                    filename=filename,
                )

            audio_b64 = str(form.get("audio_base64") or form.get("audio") or "")
            if audio_b64:
                return transcribe_audio_payload(
                    audio_base64=audio_b64,
                    language_code=language_code,
                )
            raise ValueError("No audio file or base64 data provided in form")
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Form audio transcription failed: {exc}",
            )

    try:
        data = await request.json()
        audio_b64 = data.get("audio_base64") or data.get("audio") or data.get("data") or ""
        language_code = data.get("language_code") or data.get("language") or "en-IN"
        return transcribe_audio_payload(
            audio_base64=audio_b64,
            language_code=language_code,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"JSON audio transcription failed: {exc}",
        )


@router.post("/transcribe-file", response_model=TranscribeResponse)
async def transcribe_audio_file(
    file: UploadFile = File(...),
    language_code: str = Form(default="en-IN"),
):
    """Transcribe raw multipart audio file (e.g. webm/wav from MediaRecorder)."""
    try:
        contents = await file.read()
        return transcribe_audio_bytes(
            audio_bytes=contents,
            language_code=language_code,
            filename=file.filename or "recording.webm",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Audio transcription error: {exc}",
        )


@router.post("/speak", response_model=SynthesizeResponse)
@router.post("/synthesize", response_model=SynthesizeResponse)
def synthesize_speech(data: SynthesizeRequest):
    """Synthesize text into speech audio bytes using Sarvam TTS with local fallback."""
    try:
        return synthesize_speech_payload(
            text=data.text,
            language_code=data.language_code,
            voice_gender=data.voice_gender,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get("/reminders-dictation")
def get_reminders_dictation(
    language: str = "en-IN",
    lang: Optional[str] = None,
    patient_id: Optional[str] = None,
    db: DBSession = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Returns today's schedule and structured spoken dictation in the requested language.
    """
    effective_language = lang or language or "en-IN"
    target_patient_id = None
    if patient_id:
        try:
            target_patient_id = UUID(patient_id)
        except Exception:
            target_patient_id = None

    if not target_patient_id and current_user:
        if current_user.role == UserRole.PATIENT:
            target_patient_id = current_user.id
        elif current_user.role == UserRole.CARETAKER:
            from app.models.patient import PatientProfile
            prof = db.query(PatientProfile).filter(PatientProfile.primary_caretaker_id == current_user.id).first()
            if prof:
                target_patient_id = prof.user_id
        elif current_user.role == UserRole.DOCTOR:
            from app.models.patient import PatientProfile
            prof = db.query(PatientProfile).filter(PatientProfile.primary_doctor_id == current_user.id).first()
            if prof:
                target_patient_id = prof.user_id

    from datetime import date
    from app.services.task_service import get_patient_tasks

    tasks = []
    if target_patient_id and db:
        tasks = get_patient_tasks(
            db=db,
            patient_id=target_patient_id,
            task_date=date.today(),
        )

    pending = [t for t in tasks if t.status == TaskStatus.PENDING]
    completed = [t for t in tasks if t.status == TaskStatus.COMPLETED]
    total = len(tasks)
    l = effective_language[:2].lower()

    if total == 0:
        dictation = {
            "en": "You have no pending reminders scheduled for today. Remember to drink water and take a rest.",
            "hi": "आज के लिए आपका कोई रिमाइंडर शेड्यूल नहीं है। समय पर पानी पिएं और विश्राम करें।",
            "as": "আজি আপোনাৰ কোনো সোঁৱৰণী নাই। নিয়মীয়াকৈ পানী খাওক আৰু বিশ্ৰাম লওক।",
            "bn": "আজ আপনার কোনো রিমাইন্ডার নির্ধারিত নেই। নিয়ম করে জল খান ও বিশ্রাম নিন।",
            "ne": "आज तपाईंका लागि कुनै रिमाइन्डर छैन। पानी पिउनुहोस् र आराम गर्नुहोस्।",
            "te": "ఈ రోజు మీకు ఎటువంటి పెండింగ్ రిమైండర్‌లు లేవు. సమయానికి నీరు తాగి విశ్రాంతి తీసుకోండి.",
            "ta": "இன்று உங்களுக்கு எந்த நினைவூட்டல்களும் இல்லை. ஓய்வெடுத்துக் கொள்ளுங்கள்.",
            "mr": "आज तुमच्यासाठी कोणतेही प्रलंबित स्मरणपत्रे नाहीत. विश्रांती घ्या.",
            "gu": "આજે તમારા માટે કોઈ રીમાઇન્ડર નિર્ધારિત નથી. આરામ કરો.",
            "mni": "ঙসিগী ওইনা অতোপ্পা সোঁৱৰণী লৈতে। পীনবদা পোথাবা লৌবীয়ু।",
            "brx": "दिनैनि थाखाय जेबो रिमाइन्डर गैया। आराम खालाम।",
        }.get(l, "You have no reminders scheduled for today. Remember to rest and stay hydrated.")
    elif len(pending) == 0:
        dictation = {
            "en": f"Great job! You have completed all {total} tasks scheduled for today.",
            "hi": f"बहुत बढ़िया! आज के आपके सभी {total} काम पूरे हो चुके हैं।",
            "as": f"বৰ সুন্দৰ! আজিৰ সকলো {total} টা কামেই সম্পন্ন হৈছে।",
            "bn": f"চমৎকার! আজকের সব {total}টি কাজই সম্পন্ন হয়েছে।",
            "ne": f"धेरै राम्रो! आजका सबै {total} वटा कामहरू पूरा भएका छन्।",
            "te": f"చాలా బాగుంది! ఈ రోజు షెడ్యూల్ చేసిన మొత్తం {total} పనులు పూర్తయ్యాయి.",
            "ta": f"அருமை! இன்றைய அனைத்து {total} பணிகளும் முடிந்துவிட்டன.",
            "mr": f"छान! आजची सर्व {total} कामे पूर्ण झाली आहेत.",
            "gu": f"ખૂબ સરસ! આજના તમામ {total} કાર્યો પૂર્ણ થઈ ગયા છે.",
            "mni": f"য়াম্না ফরে! ঙসিগী থবক {total} মপুং ফারে।",
            "brx": f"मोजां जादों! दिनैनि गासै {total} खामानिफोरा जोबबाय।",
        }.get(l, f"Great job! All {total} tasks are completed for today.")
    else:
        top_pending = pending[:3]
        formatted_items_en = [f"{t.scheduled_time.strftime('%I:%M %p')} - {t.title}" for t in top_pending]
        formatted_items_hi = [f"{t.scheduled_time.strftime('%I:%M %p')} पर {t.title}" for t in top_pending]
        formatted_items_as = [f"{t.scheduled_time.strftime('%I:%M %p')}ত {t.title}" for t in top_pending]
        formatted_items_bn = [f"{t.scheduled_time.strftime('%I:%M %p')} টায় {t.title}" for t in top_pending]
        formatted_items_te = [f"{t.scheduled_time.strftime('%I:%M %p')} కి {t.title}" for t in top_pending]

        if l == "hi":
            dictation = f"आज आपके कुल {total} काम हैं, जिनमें से {len(pending)} काम बाकी हैं: " + ", और ".join(formatted_items_hi) + f"। {len(completed)} काम पहले ही पूरे हो चुके हैं।"
        elif l == "as":
            dictation = f"আজি আপোনাৰ মুঠ {total} টা কামৰ ভিতৰত {len(pending)} টা বাকী আছে: " + ", আৰু ".join(formatted_items_as) + "।"
        elif l == "bn":
            dictation = f"আজ আপনার মোট {total}টি কাজের মধ্যে {len(pending)}টি কাজ বাকি রয়েছে: " + ", এবং ".join(formatted_items_bn) + "।"
        elif l == "ne":
            dictation = f"आज तपाईंका कुल {total} कामहरू मध्ये {len(pending)} वटा बाँकी छन्: " + ", र ".join(formatted_items_hi) + "।"
        elif l == "te":
            dictation = f"ఈ రోజు మీకు మొత్తం {total} పనులు ఉన్నాయి, వాటిలో {len(pending)} పనులు మిగిలి ఉన్నాయి: " + ", మరియు ".join(formatted_items_te) + f"। {len(completed)} పనులు ఇప్పటికే పూర్తయ్యాయి."
        elif l == "ta":
            dictation = f"இன்று உங்களுக்கு {total} பணிகள் உள்ளன, இதில் {len(pending)} பணிகள் மீதமுள்ளன."
        elif l == "mr":
            dictation = f"आज तुमची एकूण {total} कामे आहेत, त्यापैकी {len(pending)} कामे बाकी आहेत."
        elif l == "gu":
            dictation = f"આજે તમારા કુલ {total} કાર્યો છે, જેમાંથી {len(pending)} કાર્યો બાકી છે."
        elif l == "mni":
            dictation = f"ঙসি থবক {total}গী মনুংদা {len(pending)} লেমহৌরি।"
        elif l == "brx":
            dictation = f"दिनै गासै {total} खामानिआव {len(pending)} थाबाय।"
        else:
            dictation = f"You have {total} tasks scheduled today. {len(pending)} are pending: " + ", and ".join(formatted_items_en) + f". {len(completed)} tasks are finished."

    next_task = None
    if pending:
        next_task = {
            "title": pending[0].title,
            "time": pending[0].scheduled_time.strftime("%I:%M %p"),
            "description": pending[0].description or "",
        }

    return {
        "total_tasks": total,
        "pending_tasks": len(pending),
        "completed_tasks": len(completed),
        "dictation": dictation,
        "next_task": next_task,
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "time": t.scheduled_time.strftime("%I:%M %p"),
                "status": t.status.value,
            }
            for t in tasks
        ],
    }
