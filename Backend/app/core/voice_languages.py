"""
Single Source of Truth for Voice Languages and Capabilities in SmritiSetu Backend.
Mirrors Frontend/src/features/voice/config/languageRegistry.ts.
"""

from typing import Literal, TypedDict
from app.schemas.voice import VoiceLanguage

VoiceLanguageCode = Literal[
    "en-IN",
    "hi-IN",
    "bn-IN",
    "ta-IN",
    "te-IN",
    "mr-IN",
    "gu-IN",
    "as-IN",
    "ne-IN",
    "mni-IN",
    "brx-IN",
]

TtsMode = Literal["full", "short-only"]
ScriptType = Literal["latin", "devanagari", "bengali", "telugu", "tamil", "gujarati"]


class LanguageCapability(TypedDict):
    code: str
    short: str
    name: str
    native_name: str
    script: ScriptType
    sarvam_stt: bool
    sarvam_translate: bool
    sarvam_llm_native: bool
    sarvam_tts: bool
    tts_mode: TtsMode
    tts_speaker: str
    stt_fallback_locale: str
    browser_tts_chain: list[str]


LANGUAGE_REGISTRY: dict[str, LanguageCapability] = {
    "en-IN": {
        "code": "en-IN",
        "short": "en",
        "name": "English",
        "native_name": "English",
        "script": "latin",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": True,
        "sarvam_tts": True,
        "tts_mode": "full",
        "tts_speaker": "kavya",
        "stt_fallback_locale": "en-IN",
        "browser_tts_chain": ["en-IN", "en-GB", "en-US", "en"],
    },
    "hi-IN": {
        "code": "hi-IN",
        "short": "hi",
        "name": "Hindi",
        "native_name": "हिन्दी",
        "script": "devanagari",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": True,
        "sarvam_tts": True,
        "tts_mode": "full",
        "tts_speaker": "priya",
        "stt_fallback_locale": "hi-IN",
        "browser_tts_chain": ["hi-IN", "hi"],
    },
    "bn-IN": {
        "code": "bn-IN",
        "short": "bn",
        "name": "Bengali",
        "native_name": "বাংলা",
        "script": "bengali",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": True,
        "sarvam_tts": True,
        "tts_mode": "full",
        "tts_speaker": "priya",
        "stt_fallback_locale": "bn-IN",
        "browser_tts_chain": ["bn-IN", "bn-BD", "bn"],
    },
    "ta-IN": {
        "code": "ta-IN",
        "short": "ta",
        "name": "Tamil",
        "native_name": "தமிழ்",
        "script": "tamil",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": True,
        "sarvam_tts": True,
        "tts_mode": "full",
        "tts_speaker": "priya",
        "stt_fallback_locale": "ta-IN",
        "browser_tts_chain": ["ta-IN", "ta-LK", "ta"],
    },
    "te-IN": {
        "code": "te-IN",
        "short": "te",
        "name": "Telugu",
        "native_name": "తెలుగు",
        "script": "telugu",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": True,
        "sarvam_tts": True,
        "tts_mode": "full",
        "tts_speaker": "priya",
        "stt_fallback_locale": "te-IN",
        "browser_tts_chain": ["te-IN", "te"],
    },
    "mr-IN": {
        "code": "mr-IN",
        "short": "mr",
        "name": "Marathi",
        "native_name": "मराठी",
        "script": "devanagari",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": True,
        "sarvam_tts": True,
        "tts_mode": "full",
        "tts_speaker": "priya",
        "stt_fallback_locale": "mr-IN",
        "browser_tts_chain": ["mr-IN", "mr"],
    },
    "gu-IN": {
        "code": "gu-IN",
        "short": "gu",
        "name": "Gujarati",
        "native_name": "ગુજરાતી",
        "script": "gujarati",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": True,
        "sarvam_tts": True,
        "tts_mode": "full",
        "tts_speaker": "priya",
        "stt_fallback_locale": "gu-IN",
        "browser_tts_chain": ["gu-IN", "gu"],
    },
    "as-IN": {
        "code": "as-IN",
        "short": "as",
        "name": "Assamese",
        "native_name": "অসমীয়া",
        "script": "bengali",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": False,
        "sarvam_tts": False,
        "tts_mode": "short-only",
        "tts_speaker": "priya",
        "stt_fallback_locale": "as-IN",
        "browser_tts_chain": ["as-IN", "as"],
    },
    "ne-IN": {
        "code": "ne-IN",
        "short": "ne",
        "name": "Nepali",
        "native_name": "नेपाली",
        "script": "devanagari",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": False,
        "sarvam_tts": False,
        "tts_mode": "short-only",
        "tts_speaker": "priya",
        "stt_fallback_locale": "ne-NP",
        "browser_tts_chain": ["ne-NP", "ne-IN", "ne"],
    },
    "mni-IN": {
        "code": "mni-IN",
        "short": "mni",
        "name": "Manipuri",
        "native_name": "মৈতৈলোন্",
        "script": "bengali",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": False,
        "sarvam_tts": False,
        "tts_mode": "short-only",
        "tts_speaker": "priya",
        "stt_fallback_locale": "mni-IN",
        "browser_tts_chain": ["mni-IN", "mni"],
    },
    "brx-IN": {
        "code": "brx-IN",
        "short": "brx",
        "name": "Bodo",
        "native_name": "बर'",
        "script": "devanagari",
        "sarvam_stt": True,
        "sarvam_translate": True,
        "sarvam_llm_native": False,
        "sarvam_tts": False,
        "tts_mode": "short-only",
        "tts_speaker": "priya",
        "stt_fallback_locale": "brx-IN",
        "browser_tts_chain": ["brx-IN", "brx"],
    },
}

SUPPORTED_VOICE_LANGUAGES: list[VoiceLanguage] = [
    VoiceLanguage(
        code=cap["code"],
        name=cap["name"],
        native_name=cap["native_name"],
    )
    for cap in LANGUAGE_REGISTRY.values()
]

# Derived capability sets
SARVAM_STT_SUPPORTED: set[str] = {
    code for code, cap in LANGUAGE_REGISTRY.items() if cap["sarvam_stt"]
}

SARVAM_TTS_SUPPORTED: set[str] = {
    code for code, cap in LANGUAGE_REGISTRY.items() if cap["sarvam_tts"]
}

FULL_TTS_LANGUAGES: set[str] = {
    code for code, cap in LANGUAGE_REGISTRY.items() if cap["tts_mode"] == "full"
}

SHORT_ONLY_LANGUAGES: set[str] = {
    code for code, cap in LANGUAGE_REGISTRY.items() if cap["tts_mode"] == "short-only"
}

BHASHINI_STT_SUPPORTED: set[str] = {"as-IN", "mni-IN", "brx-IN", "ne-IN"}
BHASHINI_TTS_SUPPORTED: set[str] = {"as-IN", "mni-IN", "brx-IN", "ne-IN"}


def get_language_capability(code: str) -> LanguageCapability:
    """Returns capability dict for given language code with fallback to en-IN."""
    clean = code.strip()
    if clean in LANGUAGE_REGISTRY:
        return LANGUAGE_REGISTRY[clean]
    # Try prefix matching (e.g. 'hi' -> 'hi-IN')
    for reg_code, cap in LANGUAGE_REGISTRY.items():
        if cap["short"] == clean.lower() or reg_code.lower().startswith(clean.lower()):
            return cap
    return LANGUAGE_REGISTRY["en-IN"]


def compute_runtime_capabilities(sarvam_key: str | None, bhashini_key: str | None) -> dict[str, dict[str, str]]:
    """
    Computes runtime STT/TTS capabilities for each language given configured API keys.
    """
    results: dict[str, dict[str, str]] = {}
    for code, cap in LANGUAGE_REGISTRY.items():
        # STT probe
        if sarvam_key and cap["sarvam_stt"]:
            stt = "sarvam"
        elif bhashini_key and code in BHASHINI_STT_SUPPORTED:
            stt = "bhashini"
        else:
            stt = "browser"

        # TTS probe
        if sarvam_key and cap["sarvam_tts"]:
            tts = "sarvam"
            tts_mode = "full"
        elif bhashini_key and code in BHASHINI_TTS_SUPPORTED:
            tts = "bhashini"
            tts_mode = "full"  # Bhashini upgrade allows full audio synthesis
        else:
            tts = "none"
            tts_mode = "short-only" if code in SHORT_ONLY_LANGUAGES else "full"

        results[code] = {
            "code": code,
            "stt": stt,
            "tts": tts,
            "ttsMode": tts_mode,
        }
    return results
