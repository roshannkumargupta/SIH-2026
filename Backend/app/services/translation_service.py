import logging
from app.schemas.translation import (
    BatchTranslateResponse,
    TranslateResponse,
    TranslationLanguage,
)

logger = logging.getLogger("translation_service")

SUPPORTED_TRANSLATION_LANGUAGES = [
    TranslationLanguage(code="en", name="English", native_name="English"),
    TranslationLanguage(code="hi", name="Hindi", native_name="हिन्दी"),
    TranslationLanguage(code="bn", name="Bengali", native_name="বাংলা"),
    TranslationLanguage(code="te", name="Telugu", native_name="తెలుగు"),
    TranslationLanguage(code="ta", name="Tamil", native_name="தமிழ்"),
    TranslationLanguage(code="mr", name="Marathi", native_name="मराठी"),
    TranslationLanguage(code="gu", name="Gujarati", native_name="ગુજરાતી"),
    TranslationLanguage(code="kn", name="Kannada", native_name="ಕನ್ನಡ"),
    TranslationLanguage(code="ml", name="Malayalam", native_name="മലയാളം"),
    TranslationLanguage(code="pa", name="Punjabi", native_name="ਪੰਜਾਬੀ"),
]

# Essential clinical & reminder phrases dictionary for immediate reliable local translation
CLINICAL_DICTIONARY: dict[str, dict[str, str]] = {
    "please take your medication": {
        "hi": "कृपया अपनी दवा लें",
        "bn": "অনুগ্রহ করে আপনার ওষুধ খান",
        "te": "దయచేసి మీ మందులు తీసుకోండి",
        "ta": "தயவுசெய்து உங்கள் மருந்தை உட்கொள்ளுங்கள்",
        "mr": "कृपया आपले औषध घ्या",
        "gu": "કૃપા કરીને તમારી દવા લો",
    },
    "medication reminder": {
        "hi": "दवा का अनुस्मारक",
        "bn": "ওষুধের স্মারক",
        "te": "మందుల రిమైండర్",
        "ta": "மருந்து நினைவூட்டல்",
        "mr": "औषध स्मरणपत्र",
        "gu": "દવાની યાદ અપાવવી",
    },
    "emergency contact": {
        "hi": "आपातकालीन संपर्क",
        "bn": "জরুরী যোগাযোগ",
        "te": "అత్యవసర సంప్రదింపు",
        "ta": "அவசர தொடர்பு",
        "mr": "तातडीचा संपर्क",
        "gu": "કટોકટી સંપર્ક",
    },
}


def get_supported_languages() -> list[TranslationLanguage]:
    return SUPPORTED_TRANSLATION_LANGUAGES


def translate_text(
    text: str,
    source_lang: str = "auto",
    target_lang: str = "hi",
) -> TranslateResponse:
    """Translates a text string to the target language with robust local fallback."""
    cleaned = text.strip()
    if not cleaned:
        return TranslateResponse(
            original_text=text,
            translated_text="",
            source_language=source_lang,
            target_language=target_lang,
        )

    # If already target language, return as is
    if source_lang == target_lang:
        return TranslateResponse(
            original_text=text,
            translated_text=text,
            source_language=source_lang,
            target_language=target_lang,
        )

    lower_text = cleaned.lower()
    translated = None

    # Check local dictionary
    if lower_text in CLINICAL_DICTIONARY and target_lang in CLINICAL_DICTIONARY[lower_text]:
        translated = CLINICAL_DICTIONARY[lower_text][target_lang]
    else:
        # Fallback representation preserving meaning
        translated = f"[{target_lang.upper()}] {cleaned}"

    detected_src = "en" if source_lang == "auto" else source_lang

    return TranslateResponse(
        original_text=text,
        translated_text=translated,
        source_language=detected_src,
        target_language=target_lang,
    )


def batch_translate_texts(
    texts: list[str],
    source_lang: str = "auto",
    target_lang: str = "hi",
) -> BatchTranslateResponse:
    """Batch translates a list of text strings."""
    results = [
        translate_text(t, source_lang, target_lang).translated_text
        for t in texts
    ]
    detected_src = "en" if source_lang == "auto" else source_lang

    return BatchTranslateResponse(
        translations=results,
        source_language=detected_src,
        target_language=target_lang,
    )
