from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.translation import (
    BatchTranslateRequest,
    BatchTranslateResponse,
    TranslateRequest,
    TranslateResponse,
    TranslationLanguage,
)
from app.services.translation_service import (
    batch_translate_texts,
    get_supported_languages,
    translate_text,
)

router = APIRouter(
    prefix="/translate",
    tags=["Multilingual Translation"],
)


@router.get("/languages", response_model=list[TranslationLanguage])
def list_translation_languages():
    """List supported languages for multilingual translation."""
    return get_supported_languages()


@router.post("", response_model=TranslateResponse)
def translate(
    data: TranslateRequest,
    current_user: User = Depends(get_current_user),
):
    """Translate text to another language."""
    return translate_text(
        text=data.text,
        source_lang=data.source_language,
        target_lang=data.target_language,
    )


@router.post("/batch", response_model=BatchTranslateResponse)
def batch_translate(
    data: BatchTranslateRequest,
    current_user: User = Depends(get_current_user),
):
    """Translate multiple phrases in a single request."""
    return batch_translate_texts(
        texts=data.texts,
        source_lang=data.source_language,
        target_lang=data.target_language,
    )
