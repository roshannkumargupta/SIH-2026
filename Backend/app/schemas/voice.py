from pydantic import AliasChoices, BaseModel, Field


class TranscribeRequest(BaseModel):
    audio_base64: str = Field(
        default="",
        validation_alias=AliasChoices("audio_base64", "audio", "data"),
        description="Base64 encoded audio bytes (wav, mp3, ogg, webm)",
    )
    language_code: str = Field(
        default="en-IN",
        validation_alias=AliasChoices("language_code", "language"),
        max_length=10,
    )


class TranscribeResponse(BaseModel):
    transcribed_text: str
    detected_language: str
    confidence: float
    duration_seconds: float | None = None
    text: str | None = None


class InterpretRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000, description="Raw input text to interpret")
    language: str = Field(
        default="en",
        validation_alias=AliasChoices("language", "language_code"),
        max_length=10,
        description="Language hint e.g. en, hi, as, bn",
    )


class InterpretResponse(BaseModel):
    intent: str
    confidence: float
    entity: str | None = None


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    language_code: str = Field(default="en-IN", max_length=10)
    voice_gender: str = Field(default="female", pattern="^(female|male)$")


class SynthesizeResponse(BaseModel):
    audio_base64: str
    audio_format: str = "audio/wav"
    language_code: str
    text: str


class VoiceLanguage(BaseModel):
    code: str
    name: str
    native_name: str
