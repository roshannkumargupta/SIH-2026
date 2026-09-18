import pytest
from app.core.voice_languages import (
    LANGUAGE_REGISTRY,
    SUPPORTED_VOICE_LANGUAGES,
    SARVAM_STT_SUPPORTED,
    SARVAM_TTS_SUPPORTED,
    FULL_TTS_LANGUAGES,
    SHORT_ONLY_LANGUAGES,
    compute_runtime_capabilities,
)


def test_voice_languages_count_and_codes(client):
    """Ensure exactly 11 languages are registered and returned by the languages endpoint."""
    res = client.get("/api/v1/voice/languages")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 11
    codes = {item["code"] for item in data}
    expected = {
        "en-IN", "hi-IN", "bn-IN", "ta-IN", "te-IN",
        "mr-IN", "gu-IN", "as-IN", "ne-IN", "mni-IN", "brx-IN"
    }
    assert codes == expected


def test_capabilities_endpoint(client):
    """Ensure /api/v1/voice/capabilities returns valid probe maps for all 11 languages."""
    res = client.get("/api/v1/voice/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 11

    # Check that every language has required keys
    for code, cap in data.items():
        assert "code" in cap
        assert "stt" in cap
        assert "tts" in cap
        assert "ttsMode" in cap
        assert cap["stt"] in ("sarvam", "bhashini", "browser")
        assert cap["tts"] in ("sarvam", "bhashini", "none")
        assert cap["ttsMode"] in ("full", "short-only")


def test_stt_and_tts_sets_consistency():
    """Verify STT covers all 11 languages and TTS split is 7 full / 4 short-only."""
    all_11 = {
        "en-IN", "hi-IN", "bn-IN", "ta-IN", "te-IN",
        "mr-IN", "gu-IN", "as-IN", "ne-IN", "mni-IN", "brx-IN"
    }
    assert set(LANGUAGE_REGISTRY.keys()) == all_11
    # Sarvam Saaras v3 STT covers all 11
    assert SARVAM_STT_SUPPORTED == all_11

    # Sarvam Bulbul v3 covers 7 full languages
    assert FULL_TTS_LANGUAGES == {"en-IN", "hi-IN", "bn-IN", "ta-IN", "te-IN", "mr-IN", "gu-IN"}
    assert SHORT_ONLY_LANGUAGES == {"as-IN", "ne-IN", "mni-IN", "brx-IN"}
    assert SARVAM_TTS_SUPPORTED == FULL_TTS_LANGUAGES


def test_runtime_probe_computation():
    """Test runtime probe behavior with mock API keys."""
    # When both Sarvam and Bhashini keys are configured
    full_probes = compute_runtime_capabilities(sarvam_key="test_sarvam", bhashini_key="test_bhashini")
    assert full_probes["en-IN"]["stt"] == "sarvam"
    assert full_probes["en-IN"]["tts"] == "sarvam"
    assert full_probes["en-IN"]["ttsMode"] == "full"

    # Assamese gets upgraded if Bhashini is configured
    assert full_probes["as-IN"]["stt"] == "sarvam"
    assert full_probes["as-IN"]["tts"] == "bhashini"
    assert full_probes["as-IN"]["ttsMode"] == "full"

    # When Bhashini is not configured and Sarvam has no as-IN TTS
    sarvam_only = compute_runtime_capabilities(sarvam_key="test_sarvam", bhashini_key=None)
    assert sarvam_only["as-IN"]["tts"] == "none"
    assert sarvam_only["as-IN"]["ttsMode"] == "short-only"
