"""
Universal NLP Interpreter for SmritiSetu Voice Assistant.
Implements universal 3-tier intent classification for all 11 Indic languages.
Loads unified phrase tables from app/core/voice_phrases.json.
"""

import json
import logging
import os
import re
import unicodedata
from functools import lru_cache
from typing import Any

logger = logging.getLogger("nlp_interpreter")

SYSTEM_PROMPT = """You are an intent classifier for SmritiSetu, an elderly-care voice assistant cognitive app.
The app features:
  1. Games section - 24 cognitive exercises (Water Jugs, Tower of Hanoi, Ball Sort, Memory Match, Number Sequence, Word Scramble, Quick Math, Stroop Test, Maze, etc.)
  2. Reminders & Routine section - today's schedule, daily routine tasks, and activities
  3. Medications section - daily doses, medication schedules, logging taken/skipped medicines
  4. Memories album - family photos, audio recollections
  5. AI Cognitive Analytics - cognitive performance, memory retention trends
  6. Caregiver section - caregiver monitoring view

Valid intents:
  GO_HOME          - return home / dashboard (e.g. "go home", "मुख्य पृष्ठ")
  OPEN_GAMES       - open cognitive games center (e.g. "play games", "खेल खोलो")
  NEXT_GAME        - switch to next brain game (e.g. "next game", "अगला खेल")
  OPEN_GAME        - specific game named; entity: WATER_JUGS, TOWER_OF_HANOI, BALL_SORT, N_BACK, LOGIC_PUZZLES, STROOP, MENTAL_ROTATION, SCHULTE_TABLE, MAZE, CARD_MATCHING, NUMBER_SEQUENCE, WORD_SCRAMBLE, QUICK_MATH, VISUAL_SEARCH, REACTION_TIME, SIMON_SAYS, TRAIL_MAKING, ANAGRAM_SOLVER, DELAYED_RECALL, PATTERN_MATRIX, DUAL_TASK, WORKING_MEMORY_GRID, CULTURAL_OBJECT_RECOGNITION, DAILY_ROUTINE_RECALL
  OPEN_REMINDERS   - open daily routine / tasks (e.g. "show reminders", "रूटीन दिखाओ")
  TODAY_REMINDERS  - what tasks do I have today (e.g. "what do I have today", "आज क्या करना है")
  NEXT_REMINDER    - what is my next reminder (e.g. "what is my next task", "अगला काम")
  ADD_ROUTINE      - add a routine task (e.g. "add task", "नया काम जोड़ो")
  COMPLETE_ROUTINE - mark task done (e.g. "task completed", "काम पूरा हो गया")
  REMOVE_ROUTINE   - delete task (e.g. "delete task", "काम हटाओ")
  UPDATE_ROUTINE   - change time/reschedule (e.g. "change time", "समय बदलो")
  OPEN_MEDICATIONS - open medications schedule (e.g. "show my medicines", "दवाइयां दिखाओ")
  TODAY_MEDICATIONS- what medicines today (e.g. "what medicine do I take today", "आज कौन सी दवा लेनी है")
  NEXT_MEDICATION  - what is next dose (e.g. "what is my next dose", "अगली दवा कौन सी है")
  MEDICATION_TAKEN - user says they took their medicine (e.g. "I took my medicine", "दवाई ले ली")
  MEDICATION_SKIPPED- user says they skipped their medicine (e.g. "skipped medicine", "दवा छोड़ दी")
  OPEN_ANALYTICS   - open progress / cognitive report (e.g. "show my progress", "मेरी प्रोग्रेस दिखाओ")
  OPEN_MEMORIES    - open memories / photos (e.g. "show my memories", "मेरी यादें दिखाओ")
  OPEN_CAREGIVER   - open caregiver portal (e.g. "caregiver", "देखभालकर्ता")
  HELP             - help or guide (e.g. "help", "मदद")
  CLOSE            - dismiss / close assistant (e.g. "close", "बंद करो")
  UNKNOWN          - cannot determine intent

Respond with ONLY valid JSON:
{"intent":"OPEN_GAMES","confidence":0.95,"entity":null}"""

# Load Unified Phrase Tables from JSON emitted by gen-voice-phrases
VOICE_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "core", "voice_phrases.json")
try:
    with open(VOICE_DATA_PATH, "r", encoding="utf-8") as f:
        VOICE_PHRASES_DATA: dict[str, Any] = json.load(f)
except Exception as exc:
    logger.warning(f"Could not load voice_phrases.json: {exc}")
    VOICE_PHRASES_DATA = {}

# Native numeral conversion map
NATIVE_DIGIT_MAP = {
    # Devanagari
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
    # Bengali / Assamese / Manipuri
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
    # Telugu
    "౦": "0", "౧": "1", "౨": "2", "౩": "3", "౪": "4",
    "౫": "5", "౬": "6", "౭": "7", "౮": "8", "౯": "9",
    # Tamil
    "௦": "0", "௧": "1", "௨": "2", "௩": "3", "௪": "4",
    "௫": "5", "௬": "6", "௭": "7", "௮": "8", "௯": "9",
    # Gujarati
    "૦": "0", "૧": "1", "૨": "2", "૩": "3", "૪": "4",
    "૫": "5", "૬": "6", "૭": "7", "૮": "8", "૯": "9",
}

PUNCTUATION_REGEX = re.compile(r'[।॥.,\/#!$%\^&\*;:{}=\-_`~()?"\'¿¡\[\]\\<>@+]')
ZWJ_ZWNJ_REGEX = re.compile(r'[\u200B\u200C\u200D\uFEFF]')


def normalize_text(raw: str | None) -> str:
    """Normalizes text across Indic scripts and English."""
    if not raw:
        return ""
    # NFC normalization and lowercasing
    text = unicodedata.normalize("NFC", raw).lower()
    # Strip ZWJ/ZWNJ
    text = ZWJ_ZWNJ_REGEX.sub("", text)
    # Map native digits
    for ind, asc in NATIVE_DIGIT_MAP.items():
        text = text.replace(ind, asc)
    # Strip punctuation & danda
    text = PUNCTUATION_REGEX.sub(" ", text)
    # Collapse whitespace
    return re.sub(r"\s+", " ", text).strip()


# Shared Romanized Phrases
ROMANIZED_PHRASES: dict[str, list[str]] = {
    "OPEN_GAMES": ["khel", "khelo", "khelna hai", "game khelo", "games kholo", "game lagao", "games open", "aatalu", "vilaiyattu", "khela"],
    "NEXT_GAME": ["agla khel", "dusra game", "next game lagao", "dusra khel", "adutha game", "aarekta game"],
    "OPEN_REMINDERS": ["routine", "schedule", "reminder", "aaj ka kaam", "mere kaam", "dinacharya", "walk", "task"],
    "TODAY_REMINDERS": ["aaj kya karna hai", "aaj ke kaam", "today schedule", "aaj ka routine", "aaj ke reminders", "eroju panulu", "inraiya panigal"],
    "NEXT_REMINDER": ["agla kaam", "next task", "agla reminder", "aage kya karna hai", "aduthathu enna", "erpor ki"],
    "ADD_ROUTINE": ["kaam jodo", "naya kaam", "routine jodo", "task add karo", "reminder lagao", "kotha kaaj", "panulu cherchu"],
    "COMPLETE_ROUTINE": ["kaam ho gaya", "task complete", "routine done", "ho gaya", "khatam ho gaya", "kaam pura", "mudinjathu", "kaaj sesh"],
    "REMOVE_ROUTINE": ["kaam hatao", "delete task", "routine hatao", "task cancel", "hata do"],
    "UPDATE_ROUTINE": ["time badlo", "timing change", "samay badlo", "schedule badlo", "neram maathu"],
    "OPEN_MEDICATIONS": ["dawa", "davai", "dawai", "medicine", "tablet", "goli", "pills", "mandulu", "marunthu", "oushodh", "dawaaiyan"],
    "TODAY_MEDICATIONS": ["aaj ki dawa", "dawa ka time", "aaj kaun si dawa", "konsi goli", "eroju mandulu", "inraiya marunthugal", "aajker oushodh"],
    "NEXT_MEDICATION": ["agli dawa", "next medicine", "agli goli", "next dose", "tarvati mandu", "adutha marunthu", "porer oushodh"],
    "MEDICATION_TAKEN": ["dawa le li", "davai kha li", "goli kha li", "tablet le liya", "dawa ho gayi", "mandu vesukunnanu", "marunthu saaptuten", "oushodh kheyechi"],
    "MEDICATION_SKIPPED": ["dawa nahi li", "skip dawa", "dawa chhod di", "goli miss ho gayi", "mandu veyyaledu", "marunthu saapdala"],
    "OPEN_ANALYTICS": ["score", "progress", "report", "mera score", "kaisa chal raha hai", "pradarshan", "naa score", "en score"],
    "OPEN_MEMORIES": ["yaadein", "photo", "tasveer", "purani photo", "family album", "gnapakalu", "ninaivugal", "smriti"],
    "OPEN_CAREGIVER": ["caregiver", "caretaker", "doctor", "madadgar", "caregiver dashboard"],
    "GO_HOME": ["home", "dashboard", "main page", "wapas", "shuru", "mukhya prishth"],
    "HELP": ["help", "madad", "guide", "sahayata", "kya bolu", "sahayam"],
    "CLOSE": ["band karo", "close", "exit", "hatao", "khatam", "ruk jao"],
}

ROMANIZED_GAMES: dict[str, list[str]] = {
    "WATER_JUGS": ["water jug", "water jugs", "jug game", "pani ka jug", "jug puzzle"],
    "TOWER_OF_HANOI": ["tower of hanoi", "hanoi", "hanoi tower", "tower game"],
    "BALL_SORT": ["ball sort", "ball puzzle", "goli sort", "rangin ball"],
    "N_BACK": ["n back", "n-back", "memory test"],
    "LOGIC_PUZZLES": ["logic puzzle", "riddle", "paheli", "tark"],
    "STROOP": ["stroop", "stroop test", "rang test", "color match"],
    "MENTAL_ROTATION": ["mental rotation", "shape rotate"],
    "SCHULTE_TABLE": ["schulte", "number grid", "number dhoondo"],
    "MAZE": ["maze", "bhulbhulaiya", "bhool bhulaiya", "rasta dhoondo"],
    "CARD_MATCHING": ["card match", "memory match", "jodi milao", "taash"],
    "NUMBER_SEQUENCE": ["number sequence", "missing number", "number series"],
    "WORD_SCRAMBLE": ["word scramble", "shabd paheli", "jumbled word"],
    "QUICK_MATH": ["quick math", "tez ganit", "math game", "hisaab"],
    "VISUAL_SEARCH": ["visual search", "dhoondo", "find object"],
    "REACTION_TIME": ["reaction time", "speed tap", "reflex"],
    "SIMON_SAYS": ["simon says", "pattern yaad rakho"],
    "TRAIL_MAKING": ["trail making", "bindu jodo"],
    "ANAGRAM_SOLVER": ["anagram", "word solver"],
    "DELAYED_RECALL": ["delayed recall", "shabd yaad"],
    "PATTERN_MATRIX": ["pattern matrix", "matrix"],
    "DUAL_TASK": ["dual task", "dohra kaam"],
    "WORKING_MEMORY_GRID": ["memory grid", "grid recall"],
    "CULTURAL_OBJECT_RECOGNITION": ["cultural object", "purani cheezein"],
    "DAILY_ROUTINE_RECALL": ["routine recall", "din yaad"],
}


def score_phrase(text: str, candidate_raw: str) -> float:
    """Scores match between candidate phrase and user input text."""
    candidate = normalize_text(candidate_raw)
    if not candidate or not text:
        return 0.0

    c_tokens = candidate.split()
    t_tokens = text.split()

    score = 0.0
    if text == candidate:
        score = 1.0
    elif text.startswith(candidate + " ") or text.endswith(" " + candidate) or f" {candidate} " in text:
        coverage = len(candidate) / len(text)
        score = 0.70 + 0.20 * coverage
        if text.startswith(candidate):
            score += 0.05
    elif candidate in text:
        score = 0.60
        if text.startswith(candidate):
            score += 0.05
    else:
        matched = sum(1 for tok in c_tokens if tok in t_tokens)
        if matched == len(c_tokens) and len(c_tokens) > 1:
            score = 0.70
        elif matched > 0 and len(c_tokens) > 1:
            score = 0.45 * (matched / len(c_tokens))

    # Single short token penalty (avoids "help" substring bug when not exact match)
    if text != candidate and len(c_tokens) == 1 and len(candidate) < 4:
        score -= 0.35

    return min(1.0, max(0.0, score))


def get_lang_key(lang: str) -> str:
    """Normalizes language code to match voice_phrases.json keys."""
    clean = lang.strip().lower()
    for key in VOICE_PHRASES_DATA.keys():
        if key.lower() == clean or key.lower().startswith(clean[:2]):
            return key
    return "en-IN"


def tier1_match(raw: str, lang: str = "en-IN") -> dict[str, Any]:
    """Deterministic, scored Tier 1 matcher for all 11 languages."""
    text = normalize_text(raw)
    if not text:
        return {"intent": "UNKNOWN", "confidence": 0.0, "entity": None}

    lang_key = get_lang_key(lang)
    lang_data = VOICE_PHRASES_DATA.get(lang_key) or VOICE_PHRASES_DATA.get("en-IN", {})
    en_data = VOICE_PHRASES_DATA.get("en-IN", {})

    best_intent = "UNKNOWN"
    best_score = 0.0
    best_entity: str | None = None

    def evaluate(intent: str, phrase: str, entity: str | None = None, bonus: float = 0.0):
        nonlocal best_intent, best_score, best_entity
        s = score_phrase(text, phrase) + bonus
        if s > best_score:
            best_score = s
            best_intent = intent
            best_entity = entity

    # 1. Active language game entities (highest specificity)
    for entity_key, phrases in lang_data.get("games", {}).items():
        for p in phrases:
            evaluate("OPEN_GAME", p, entity_key, 0.15)

    # Romanized games
    for entity_key, phrases in ROMANIZED_GAMES.items():
        for p in phrases:
            evaluate("OPEN_GAME", p, entity_key, 0.10)

    # English games if different
    if lang_key != "en-IN":
        for entity_key, phrases in en_data.get("games", {}).items():
            for p in phrases:
                evaluate("OPEN_GAME", p, entity_key, 0.05)

    # 2. Active language intent phrases
    for intent_key, phrases in lang_data.get("phrases", {}).items():
        for p in phrases:
            evaluate(intent_key, p, None, 0.0)

    # 3. Romanized shared phrases
    for intent_key, phrases in ROMANIZED_PHRASES.items():
        for p in phrases:
            evaluate(intent_key, p, None, -0.05)

    # 4. English fallback phrases
    if lang_key != "en-IN":
        for intent_key, phrases in en_data.get("phrases", {}).items():
            for p in phrases:
                evaluate(intent_key, p, None, -0.10)

    if best_score >= 0.58:
        ENTITY_ALIAS_MAP = {
            "CARD_MATCHING": "MEMORY_MATCH",
            "NUMBER_SEQUENCE": "NUMBER_PUZZLE",
            "WORD_SCRAMBLE": "WORD_PUZZLE",
        }
        final_entity = ENTITY_ALIAS_MAP.get(best_entity, best_entity)
        return {
            "intent": best_intent,
            "confidence": min(round(best_score, 2), 0.99),
            "entity": final_entity,
        }

    return {
        "intent": "UNKNOWN",
        "confidence": round(best_score, 2),
        "entity": None,
    }


def find_game_entity(text: str, language: str = "en") -> str | None:
    """Finds specific game entity from text if present."""
    match = tier1_match(text, language)
    if match["intent"] == "OPEN_GAME" and match["entity"]:
        return match["entity"]
    return None


def interpret_fallback(input_text: str, language: str = "en") -> dict[str, Any]:
    """Tier 1 offline deterministic fallback."""
    return tier1_match(input_text, language)


def classify_with_llm(input_text: str, language: str, api_key: str) -> dict[str, Any]:
    """Tier 2: Sarvam LLM intent classification with adequate token budget."""
    lang_key = get_lang_key(language)
    lang_label = lang_key

    user_message = f'Language hint: {lang_label}\nUser said: "{input_text}"'

    payload = {
        "model": "sarvam-105b-conversations",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.0,
        "max_tokens": 256,
        "reasoning_effort": "low",
    }

    import httpx
    res = httpx.post(
        "https://api.sarvam.ai/v1/chat/completions",
        headers={
            "api-subscription-key": api_key,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=4.5,
    )
    if res.status_code != 200:
        raise RuntimeError(f"Sarvam LLM status {res.status_code}: {res.text}")
    raw_resp = res.json()

    content = raw_resp.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    if not content:
        raise RuntimeError("Empty response from Sarvam LLM")

    clean_json = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
    clean_json = re.sub(r"\s*```$", "", clean_json).strip()
    parsed = json.loads(clean_json)

    valid_intents = {
        "GO_HOME", "ADD_ROUTINE", "COMPLETE_ROUTINE", "REMOVE_ROUTINE", "UPDATE_ROUTINE",
        "OPEN_GAMES", "NEXT_GAME", "OPEN_GAME", "OPEN_REMINDERS",
        "TODAY_REMINDERS", "NEXT_REMINDER", "OPEN_MEDICATIONS", "TODAY_MEDICATIONS",
        "NEXT_MEDICATION", "MEDICATION_TAKEN", "MEDICATION_SKIPPED",
        "OPEN_ANALYTICS", "OPEN_MEMORIES", "OPEN_CAREGIVER", "HELP", "CLOSE", "UNKNOWN",
    }
    intent = parsed.get("intent", "UNKNOWN")
    if intent == "OPEN_PROGRESS":
        intent = "OPEN_ANALYTICS"
    if intent not in valid_intents:
        raise RuntimeError(f"Unrecognized intent from LLM: {intent}")

    return {
        "intent": intent,
        "confidence": float(parsed.get("confidence", 0.90)),
        "entity": parsed.get("entity"),
    }


# In-memory LRU cache for Tier 2/3 classification
@lru_cache(maxsize=512)
def _cached_interpret(normalized_input: str, lang_code: str) -> str:
    return ""


# Cross-lingual core vocabulary for Tier 3 offline semantic translation fallback
CROSS_LINGUAL_MAP: dict[str, str] = {
    # Games
    "khel": "games", "khelo": "play games", "aatalu": "games", "vilaiyattu": "games",
    "khela": "games", "ramat": "games", "gele": "games", "gelemu": "games", "shanba": "games",
    "shaanba": "games", "game": "games", "games": "games", "play": "play",
    # Medicines
    "dawa": "medicine", "dawai": "medicine", "davai": "medicine", "mandulu": "medicine",
    "marunthu": "medicine", "oushodh": "medicine", "dorob": "medicine", "aushadh": "medicine",
    "aushadhi": "medicine", "muli": "medicine", "hidak": "medicine", "tablet": "medicine",
    "pill": "medicine", "pills": "medicine", "goli": "medicine",
    # Routine / Reminders
    "routine": "routine", "reminder": "reminder", "reminders": "reminders",
    "kaam": "tasks", "pani": "tasks", "thabak": "tasks", "khamani": "tasks", "kaaj": "tasks",
    "schedule": "schedule", "dinacharya": "routine",
    # Home
    "home": "home", "ghar": "home", "illu": "home", "veedu": "home", "bari": "home",
    "yum": "home", "nokhor": "home", "dashboard": "home",
    # Progress
    "score": "score", "progress": "progress", "report": "progress", "pragati": "progress",
    # Memories
    "photo": "memories", "photos": "memories", "yaad": "memories", "yaadein": "memories",
    "smriti": "memories", "gnapakalu": "memories", "ninaivugal": "memories", "album": "memories",
    # Help
    "help": "help", "madad": "help", "sahay": "help", "sahayam": "help", "udhavi": "help",
    "mateng": "help", "hefajab": "help",
    # Close
    "close": "close", "exit": "close", "band": "close", "stop": "close", "moosi": "close",
}


def interpret_command(input_text: str, language: str = "en", api_key: str | None = None) -> dict[str, Any]:
    """
    Classifies user command text using the universal 3-tier pipeline:
      Tier 1: Scored deterministic local match (instant native coverage for all 11 languages)
      Tier 2: Sarvam LLM with adequate token budget + hybrid validation
      Tier 3: Translate-then-classify genuine fallback (API or semantic vocabulary)
    """
    if not input_text or not input_text.strip():
        return {"intent": "UNKNOWN", "confidence": 0.0, "entity": None}

    clean_text = normalize_text(input_text)

    # 1. Run Tier 1 Matcher
    tier1_res = tier1_match(clean_text, language)

    # If Tier 1 confidence is strong (>= 0.70) or a specific game entity was matched, return immediately
    if tier1_res["confidence"] >= 0.70 or (tier1_res["intent"] == "OPEN_GAME" and tier1_res["entity"]):
        return tier1_res

    # 2. Try Tier 2 (LLM) if API key is present
    if api_key:
        try:
            llm_text = clean_text
            lang_prefix = language[:2].lower()
            if lang_prefix in ("as", "ne", "mni", "brx"):
                from app.services.translation_service import translate_text_sarvam
                translated = translate_text_sarvam(
                    text=clean_text,
                    source_language_code=language,
                    target_language_code="en-IN",
                    api_key=api_key,
                )
                if translated:
                    llm_text = translated

            llm_res = classify_with_llm(llm_text, language, api_key)

            # Agreement with Tier 1
            if llm_res["intent"] == tier1_res["intent"] and llm_res["intent"] != "UNKNOWN":
                llm_res["confidence"] = max(llm_res["confidence"], 0.95)
                if not llm_res.get("entity") and tier1_res.get("entity"):
                    llm_res["entity"] = tier1_res["entity"]
                return llm_res

            # Strong LLM intent
            if llm_res["intent"] != "UNKNOWN" and llm_res.get("confidence", 0) >= 0.65:
                return llm_res
        except Exception as exc:
            logger.warning(f"[NLP Tier 2 Error]: {exc}")

    # 3. Tier 3 Genuine Fallback: Translate utterance to English, then classify
    try:
        translated_en = None
        # Try API translation if key available
        if api_key:
            try:
                from app.services.translation_service import translate_text_sarvam
                translated_en = translate_text_sarvam(
                    text=clean_text,
                    source_language_code=language,
                    target_language_code="en-IN",
                    api_key=api_key,
                )
            except Exception:
                pass

        # If API translation was unavailable or failed, use cross-lingual semantic dictionary
        if not translated_en:
            tokens = clean_text.split()
            mapped_tokens = [CROSS_LINGUAL_MAP.get(tok, tok) for tok in tokens]
            translated_en = " ".join(mapped_tokens)

        if translated_en and translated_en != clean_text:
            t3_match = tier1_match(translated_en, "en-IN")
            if t3_match["intent"] != "UNKNOWN" and t3_match["confidence"] >= 0.55:
                t3_match["confidence"] = min(t3_match["confidence"], 0.85)
                return t3_match
    except Exception as exc:
        logger.warning(f"[NLP Tier 3 Error]: {exc}")

    # Return best available match or UNKNOWN
    return tier1_res
