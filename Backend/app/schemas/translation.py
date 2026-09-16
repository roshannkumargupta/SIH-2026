from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    source_language: str = Field(default="auto", max_length=10)
    target_language: str = Field(default="hi", max_length=10)


class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str


class BatchTranslateRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=50)
    source_language: str = Field(default="auto", max_length=10)
    target_language: str = Field(default="hi", max_length=10)


class BatchTranslateResponse(BaseModel):
    translations: list[str]
    source_language: str
    target_language: str


class TranslationLanguage(BaseModel):
    code: str
    name: str
    native_name: str
