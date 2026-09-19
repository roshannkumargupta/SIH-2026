"""
Game → Clinical Domain mapping.

Reads the single-source-of-truth JSON (shared/game_cognitive_domains.json) and
exposes lookup structures used by the cognitive engine.

The five clinical domains are:
  memory, attention, executive_function, language, visuospatial

Game IDs are kebab-case in the JSON but callers may pass underscore variants;
both forms are indexed.
"""

import json
import logging
from pathlib import Path
from typing import Final

logger = logging.getLogger("game_domain_mapping")

# ---------------------------------------------------------------------------
# Locate the shared JSON
# ---------------------------------------------------------------------------
_SHARED_JSON_CANDIDATES = [
    # Repo-relative (works when CWD is Backend/)
    Path(__file__).resolve().parents[2] / ".." / "shared" / "game_cognitive_domains.json",
    # Repo-relative (works when CWD is repo root)
    Path(__file__).resolve().parents[3] / "shared" / "game_cognitive_domains.json",
]


def _load_shared_json() -> tuple[dict[str, list[str]], dict[str, int]]:
    """Load game→domains and max_levels from the shared JSON file."""
    for candidate in _SHARED_JSON_CANDIDATES:
        resolved = candidate.resolve()
        if resolved.is_file():
            with open(resolved, encoding="utf-8") as f:
                data = json.load(f)
            logger.info("Loaded game data from %s", resolved)
            games = data.get("games", {})
            max_levels = data.get("max_levels", {g: 10 for g in games})
            return games, max_levels

    # Fallback: hardcoded mapping (keeps backend functional even without the file)
    logger.warning(
        "shared/game_cognitive_domains.json not found; using hardcoded mapping"
    )
    fallback_games = {
        "water-jugs": ["executive_function"],
        "tower-of-hanoi": ["executive_function", "visuospatial"],
        "ball-sort": ["executive_function"],
        "n-back": ["memory", "attention", "executive_function"],
        "logic-puzzles": ["executive_function"],
        "stroop": ["attention", "executive_function"],
        "mental-rotation": ["visuospatial"],
        "schulte-table": ["attention"],
        "maze": ["visuospatial"],
        "pattern-matrix": ["memory", "visuospatial"],
        "quick-math": ["attention", "executive_function"],
        "word-scramble": ["language"],
        "simon-says": ["memory", "attention"],
        "card-matching": ["memory", "attention"],
        "reaction-time": ["attention"],
        "number-sequence": ["memory", "executive_function"],
        "dual-task": ["attention", "executive_function"],
        "visual-search": ["attention", "visuospatial"],
        "anagram-solver": ["language"],
        "trail-making": ["attention", "executive_function"],
        "working-memory-grid": ["memory", "executive_function", "visuospatial"],
        "delayed-recall": ["memory"],
        "daily-routine-recall": ["memory", "executive_function"],
        "cultural-object-recognition": ["memory", "language"],
    }
    return fallback_games, {g: 10 for g in fallback_games}


_raw_mapping, _raw_max_levels = _load_shared_json()

# ---------------------------------------------------------------------------
# Public lookup structures
# ---------------------------------------------------------------------------

#: All five clinical domains.
CLINICAL_DOMAINS: Final[list[str]] = [
    "memory",
    "attention",
    "executive_function",
    "language",
    "visuospatial",
]

#: game_id (kebab *or* underscore) → list of clinical domain names
GAME_TO_DOMAINS: dict[str, list[str]] = {}

#: domain → set of game_ids (kebab form)
DOMAIN_GAME_IDS: dict[str, set[str]] = {d: set() for d in CLINICAL_DOMAINS}

for _gid, _domains in _raw_mapping.items():
    kebab = _gid  # canonical form
    underscore = _gid.replace("-", "_")

    GAME_TO_DOMAINS[kebab] = _domains
    GAME_TO_DOMAINS[underscore] = _domains

    for _d in _domains:
        DOMAIN_GAME_IDS[_d].add(kebab)
        DOMAIN_GAME_IDS[_d].add(underscore)


#: All 24 canonical game IDs
ALL_GAMES: Final[list[str]] = list(_raw_mapping.keys())


#: game_id (kebab *or* underscore) → maxLevel
GAME_MAX_LEVELS: dict[str, int] = {}

for _gid, _max_lvl in _raw_max_levels.items():
    GAME_MAX_LEVELS[_gid] = int(_max_lvl)
    GAME_MAX_LEVELS[_gid.replace("-", "_")] = int(_max_lvl)


def normalize_game_id(raw: str) -> str:
    """Normalise a game ID to kebab-case."""
    return raw.replace("_", "-")


def domains_for_game(game_id: str) -> list[str]:
    """Return the clinical domains a game contributes to, or [] if unknown."""
    return GAME_TO_DOMAINS.get(game_id, GAME_TO_DOMAINS.get(game_id.replace("-", "_"), []))


get_domains_for_game = domains_for_game


def get_max_level_for_game(game_id: str) -> int:
    """Return maxLevel for a game derived from the shared single source of truth."""
    return GAME_MAX_LEVELS.get(game_id, GAME_MAX_LEVELS.get(game_id.replace("_", "-"), 10))
