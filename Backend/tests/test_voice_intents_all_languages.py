"""
220-assertion Automated Language Parity Test.
Verifies that all 11 dropdown languages resolve the 20 benchmark intents
through the universal Tier 1 deterministic matcher without silent fallbacks.
Pass threshold: >= 18/20 for each language (198/220 overall minimum; target 220/220).
"""

import json
import os
import pytest
from app.services.nlp_interpreter import tier1_match, normalize_text

VOICE_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "app", "core", "voice_phrases.json")
with open(VOICE_DATA_PATH, "r", encoding="utf-8") as f:
    VOICE_PHRASES = json.load(f)

LANGUAGES = [
    "en-IN",
    "hi-IN",
    "te-IN",
    "ta-IN",
    "mr-IN",
    "gu-IN",
    "bn-IN",
    "as-IN",
    "ne-IN",
    "mni-IN",
    "brx-IN",
]

# The 20 Canonical Benchmark Intents
INTENT_SPECS = [
    ("OPEN_GAMES", "phrases", "OPEN_GAMES"),
    ("OPEN_GAME", "games", "WATER_JUGS"),
    ("OPEN_GAME", "games", "TOWER_OF_HANOI"),
    ("NEXT_GAME", "phrases", "NEXT_GAME"),
    ("OPEN_REMINDERS", "phrases", "OPEN_REMINDERS"),
    ("TODAY_REMINDERS", "phrases", "TODAY_REMINDERS"),
    ("NEXT_REMINDER", "phrases", "NEXT_REMINDER"),
    ("ADD_ROUTINE", "phrases", "ADD_ROUTINE"),
    ("COMPLETE_ROUTINE", "phrases", "COMPLETE_ROUTINE"),
    ("REMOVE_ROUTINE", "phrases", "REMOVE_ROUTINE"),
    ("UPDATE_ROUTINE", "phrases", "UPDATE_ROUTINE"),
    ("OPEN_MEDICATIONS", "phrases", "OPEN_MEDICATIONS"),
    ("TODAY_MEDICATIONS", "phrases", "TODAY_MEDICATIONS"),
    ("NEXT_MEDICATION", "phrases", "NEXT_MEDICATION"),
    ("MEDICATION_TAKEN", "phrases", "MEDICATION_TAKEN"),
    ("OPEN_ANALYTICS", "phrases", "OPEN_ANALYTICS"),
    ("OPEN_MEMORIES", "phrases", "OPEN_MEMORIES"),
    ("GO_HOME", "phrases", "GO_HOME"),
    ("HELP", "phrases", "HELP"),
    ("CLOSE", "phrases", "CLOSE"),
]


@pytest.mark.parametrize("lang", LANGUAGES)
def test_language_intent_parity_20_benchmarks(lang):
    """
    Tests that a language correctly resolves all 20 canonical benchmark intents.
    Fails if a language resolves fewer than 18 of 20 intents.
    """
    data = VOICE_PHRASES.get(lang)
    assert data is not None, f"Voice phrases missing for {lang}"

    passed = 0
    failures = []

    for expected_intent, category, key in INTENT_SPECS:
        candidates = data.get(category, {}).get(key, [])
        assert len(candidates) > 0, f"No phrases for {lang}.{category}.{key}"

        phrase = candidates[0]
        res = tier1_match(phrase, lang)

        if res["intent"] == expected_intent:
            # For game entities, also verify entity key match
            if expected_intent == "OPEN_GAME":
                if res.get("entity") == key:
                    passed += 1
                else:
                    failures.append((phrase, expected_intent, f"entity mismatch: got {res.get('entity')}, expected {key}"))
            else:
                passed += 1
        else:
            failures.append((phrase, expected_intent, f"intent mismatch: got {res['intent']} (conf={res['confidence']})"))

    # Threshold: >= 18/20 must pass
    assert passed >= 18, f"Language {lang} scored {passed}/20 (< 18 required). Failures: {failures}"


def test_total_220_assertions_all_languages():
    """
    Aggregates the 220 assertions across all 11 languages and reports score.
    """
    total_passed = 0
    total_tests = len(LANGUAGES) * len(INTENT_SPECS)  # 11 * 20 = 220
    all_failures = []

    for lang in LANGUAGES:
        data = VOICE_PHRASES.get(lang, {})
        for expected_intent, category, key in INTENT_SPECS:
            phrase = data[category][key][0]
            res = tier1_match(phrase, lang)

            is_ok = False
            if res["intent"] == expected_intent:
                if expected_intent == "OPEN_GAME":
                    is_ok = (res.get("entity") == key)
                else:
                    is_ok = True

            if is_ok:
                total_passed += 1
            else:
                all_failures.append((lang, phrase, expected_intent, res["intent"], res.get("entity")))

    pass_rate = (total_passed / total_tests) * 100.0
    print(f"\n[Language Parity Test] {total_passed}/{total_tests} ({pass_rate:.1f}%) intents passed across all 11 languages.")

    # Minimum total passing must be >= 95% (209/220)
    assert total_passed >= 210, f"Total passed {total_passed}/220. Failures: {all_failures}"
