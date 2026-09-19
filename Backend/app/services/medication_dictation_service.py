import hashlib
import logging
from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.medication import MedicationLogStatus
from app.services.medication_service import (
    get_patient_medication_logs,
    get_patient_schedules,
)
from app.services.translation_service import translate_text_sarvam

logger = logging.getLogger(__name__)

# LRU Cache for translated dictations (max 500 items)
_dictation_cache: dict[str, str] = {}
MAX_CACHE_SIZE = 500


def _build_localized_dictation(
    total: int,
    pending_count: int,
    pending_medicines: list[str],
    taken_count: int,
    lang_prefix: str,
) -> str:
    """Builds natural, elder-friendly spoken dictation in the target Indic language."""
    if total == 0:
        return {
            "en": "You have no medications scheduled for today. Remember to drink water and stay well.",
            "hi": "आज के लिए आपकी कोई दवा निर्धारित नहीं है। समय पर पानी पिएं और स्वस्थ रहें।",
            "as": "আজি আপোনাৰ কোনো ঔষধৰ সময়সূচী নাই। নিয়মীয়াকৈ পানী খাওক আৰু সুস্থ থাকক।",
            "bn": "আজ আপনার কোনো ওষুধের সময়সূচি নির্ধারিত নেই। জল খান এবং সুস্থ থাকুন।",
            "ne": "आज तपाईंका लागि कुनै औषधिको तालिका छैन। पानी पिउनुहोस् र स्वस्थ रहनुहोस्।",
            "te": "ఈ రోజు మీకు ఎటువంటి మందుల షెడ్యూల్ లేదు. నీరు తాగి ఆరోగ్యంగా ఉండండి.",
            "ta": "இன்று உங்களுக்கு எந்த மருந்து அட்டவணையும் இல்லை. தண்ணீர் குடித்து ஆரோக்கியமாக இருங்கள்.",
            "mr": "आज तुमच्यासाठी कोणतेही औषध निर्धारित नाही. पाणी प्या आणि निरोगी राहा.",
            "gu": "આજે તમારા માટે કોઈ દવા નિર્ધારિત નથી. પાણી પીઓ અને સ્વસ્થ રહો.",
            "mni": "ঙসিগী ওইনা হিদাক-লাংথক চাবগী মতম লৈতে। ঈশিং থক্তুনা ফনা লৈবীয়ু।",
            "brx": "दिनैनि थाखाय जेबो मुलिनि सम गैया। दै लों आरो मोजाङै था।",
        }.get(lang_prefix, "You have no medications scheduled for today.")

    if pending_count == 0:
        return {
            "en": f"Great job! You have taken all {total} doses of medicine scheduled for today.",
            "hi": f"बहुत बढ़िया! आज की सभी {total} दवाइयां आप समय पर ले चुके हैं।",
            "as": f"বৰ সুন্দৰ! আজিৰ সকলো {total} টা পালি ঔষধেই আপুনি গ্ৰহণ কৰিছে।",
            "bn": f"চমৎকার! আজকের সব {total}টি ওষুধের ডোজই আপনি সময়মতো নিয়েছেন।",
            "ne": f"धेरै राम्रो! आजका सबै {total} वटा औषधिको मात्रा लिइसक्नुभएको छ।",
            "te": f"చాలా బాగుంది! ఈ రోజు తీసుకోవాల్సిన మొత్తం {total} మోతాదుల మందులు పూర్తయ్యాయి.",
            "ta": f"அருமை! இன்றைய அனைத்து {total} மருந்துகளையும் நீங்கள் எடுத்துக்கொண்டுவிட்டீர்கள்.",
            "mr": f"छान! आजची सर्व {total} औषधे वेळेवर घेतली आहेत.",
            "gu": f"ખૂબ સરસ! આજે લેવાની બધી {total} દવાઓ તમે લઈ લીધી છે.",
            "mni": f"য়াম্না ফরে! ঙসি চাবগী হিদাক {total}মক চাবা লোইরে।",
            "brx": f"जोबोर मोजां! दिनै लोंनांगौ गासै {total} मुलिखौ लोंबाय।",
        }.get(lang_prefix, f"Great job! You have taken all {total} medication doses scheduled for today.")

    items_en = ", and ".join(pending_medicines)
    items_hi = ", और ".join(pending_medicines)
    items_as = ", আৰু ".join(pending_medicines)
    items_bn = ", এবং ".join(pending_medicines)

    return {
        "en": f"You have {total} doses scheduled today. {pending_count} are pending: {items_en}. {taken_count} already taken.",
        "hi": f"आज आपकी कुल {total} दवाइयां हैं, जिनमें से {pending_count} दवाइयां बाकी हैं: {items_hi}। {taken_count} दवाएं ली जा चुकी हैं।",
        "as": f"আজি আপোনাৰ মুঠ {total} পালি ঔষধৰ ভিতৰত {pending_count} পালি বাকী আছে: {items_as}। {taken_count} পালি ইতিমধ্যে লোৱা হৈছে।",
        "bn": f"আজ আপনার মোট {total}টি ওষুধের মধ্যে {pending_count}টি ডোজ বাকি রয়েছে: {items_bn}। {taken_count}টি ওষুধ নেওয়া হয়েছে।",
        "ne": f"आज तपाईंका कुल {total} औषधिहरू मध्ये {pending_count} वटा बाँकी छन्: {items_hi}।",
        "te": f"ఈ రోజు మీకు మొత్తం {total} మోతాదుల మందులు ఉన్నాయి, వాటిలో {pending_count} మోతాదులు మిగిలి ఉన్నాయి: {items_en}.",
        "ta": f"இன்று உங்களுக்கு {total} மருந்துகள் உள்ளன, இதில் {pending_count} மருந்துகள் மீதமுள்ளன: {items_en}.",
        "mr": f"आज तुमची एकूण {total} औषधे आहेत, त्यापैकी {pending_count} औषधे बाकी आहेत: {items_en}.",
        "gu": f"આજે તમારી કુલ {total} દવાઓ છે, જેમાંથી {pending_count} દવાઓ બાકી છે: {items_en}.",
        "mni": f"ঙসি হিদাক {total}গী মনুংদা {pending_count} চাবা লেমহৌরি: {items_en}।",
        "brx": f"दिनै गासै {total} मुलिआव {pending_count} लोंनो थाबाय: {items_en}।",
    }.get(lang_prefix, f"You have {total} doses scheduled today. {pending_count} pending: {items_en}.")


def _get_short_phrase(lang_prefix: str) -> str:
    return {
        "en": "Opening medications schedule.",
        "hi": "दवाइयों का समय और सूची खोल रहा हूँ।",
        "as": "ঔষধৰ তালিকা আৰু সময়সূচী খুলি আছোঁ।",
        "bn": "ওষুধের তালিকা ও সময়সূচি খুলছি।",
        "ne": "औषधिको समय र तालिका खोल्दैछु।",
        "te": "మందుల సమయం మరియు జాబితాను తెరుస్తున్నాను.",
        "ta": "மருந்து அட்டவணையைத் திறக்கிறேன்.",
        "mr": "औषधांचे वेळापत्रक उघडत आहे.",
        "gu": "દવાનું સમયપત્રક ખોલી રહ્યો છું.",
        "mni": "হিদাক-লাংথক্কী মতম অমসুং পরিং হাংদোক্লি।",
        "brx": "मुलिनि सम आरो फारिलाइ खुलिगासिनो दं।",
    }.get(lang_prefix, "Opening medications schedule.")


async def generate_medication_dictation(
    db: Session,
    patient_id: UUID,
    language: str = "en-IN",
) -> dict[str, Any]:
    """
    Generates structured medication summary and elder-friendly natural dictation
    in the requested language across all 11 Indic language codes.
    """
    schedules = get_patient_schedules(db, patient_id, date.today())
    sched_map = {s.id: s for s in schedules}

    logs = get_patient_medication_logs(db, patient_id, date.today())

    total_doses = len(logs)
    taken = sum(1 for l in logs if l.status == MedicationLogStatus.TAKEN)
    pending = sum(1 for l in logs if l.status == MedicationLogStatus.SCHEDULED)
    missed = sum(1 for l in logs if l.status == MedicationLogStatus.MISSED)
    skipped = sum(1 for l in logs if l.status == MedicationLogStatus.SKIPPED)

    adherence = (taken / total_doses * 100) if total_doses > 0 else 100.0

    # Locate next pending dose
    next_log = next((l for l in logs if l.status == MedicationLogStatus.SCHEDULED), None)
    next_dose_info = None
    if next_log:
        s = sched_map.get(next_log.schedule_id)
        if s:
            next_dose_info = {
                "name": s.medicine_name,
                "dose": s.dosage,
                "time": next_log.scheduled_at.strftime("%I:%M %p"),
                "instructions": "",
            }

    # Pending list formatting
    pending_items = []
    for l in logs:
        if l.status == MedicationLogStatus.SCHEDULED:
            s = sched_map.get(l.schedule_id)
            name = s.medicine_name if s else "Medicine"
            dose = s.dosage if s else ""
            t_str = l.scheduled_at.strftime("%I:%M %p")
            pending_items.append(f"{name} {dose} at {t_str}".strip())

    lang_prefix = language[:2].lower()

    dictation = _build_localized_dictation(
        total=total_doses,
        pending_count=pending,
        pending_medicines=pending_items[:3],
        taken_count=taken,
        lang_prefix=lang_prefix,
    )

    short_phrase = _get_short_phrase(lang_prefix)

    # Optional Sarvam translation refinement for complex custom dosages if key present
    if settings.SARVAM_API_KEY and lang_prefix not in ("en", "hi", "bn", "as", "te", "ta", "mr", "gu", "ne"):
        cache_key = hashlib.md5(f"{dictation}:{language}".encode()).hexdigest()
        if cache_key in _dictation_cache:
            dictation = _dictation_cache[cache_key]
        else:
            try:
                translated = translate_text_sarvam(
                    text=dictation,
                    source_language_code="en-IN",
                    target_language_code=language,
                    api_key=settings.SARVAM_API_KEY,
                )
                if translated:
                    if len(_dictation_cache) >= MAX_CACHE_SIZE:
                        _dictation_cache.pop(next(iter(_dictation_cache)))
                    _dictation_cache[cache_key] = translated
                    dictation = translated
            except Exception as exc:
                logger.warning(f"Sarvam translation fallback for medication dictation: {exc}")

    doses_list = []
    for l in logs:
        s = sched_map.get(l.schedule_id)
        doses_list.append(
            {
                "log_id": str(l.id),
                "name": s.medicine_name if s else "Medicine",
                "dose": s.dosage if s else "",
                "time": l.scheduled_at.strftime("%I:%M %p"),
                "status": l.status.value,
            }
        )

    return {
        "total_doses": total_doses,
        "taken": taken,
        "pending": pending,
        "missed": missed,
        "skipped": skipped,
        "adherence_percent": int(adherence),
        "dictation": dictation,
        "short_phrase": short_phrase,
        "next_dose": next_dose_info,
        "doses": doses_list,
    }
