import json
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.game import GameSession
from app.schemas.game import GameSessionCreate, GameTypeInfo

AVAILABLE_GAMES = [
    GameTypeInfo(
        id="water_jugs",
        name="Water Jugs",
        cognitive_domain="Problem Solving",
        description="Solve logic puzzles by measuring exact amounts using different sized jugs.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="tower_of_hanoi",
        name="Tower of Hanoi",
        cognitive_domain="Problem Solving",
        description="Move disks between pegs following specific rules. Classic recursive thinking exercise.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="ball_sort",
        name="Ball Sort Puzzle",
        cognitive_domain="Problem Solving",
        description="Sort colored balls into tubes so each tube contains only one color.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="n_back",
        name="N-Back",
        cognitive_domain="Memory",
        description="Remember and match items from N steps back in a sequence. Trains working memory.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="logic_puzzles",
        name="Logic Puzzles",
        cognitive_domain="Problem Solving",
        description="Solve challenging logic and math puzzles requiring step-by-step reasoning.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="stroop",
        name="Stroop Test",
        cognitive_domain="Executive Function",
        description="Name the color of words while ignoring their meaning. Trains cognitive control.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="mental_rotation",
        name="Mental Rotation",
        cognitive_domain="Spatial Reasoning",
        description="Identify if rotated shapes match the original. Develops spatial reasoning.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="schulte_table",
        name="Schulte Table",
        cognitive_domain="Attention",
        description="Find numbers in sequence as fast as possible. Improves peripheral vision and focus.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="maze",
        name="Pathway Maze",
        cognitive_domain="Spatial Reasoning",
        description="Navigate through increasingly complex mazes. Enhances spatial planning.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="pattern_matrix",
        name="Pattern Matrix",
        cognitive_domain="Memory",
        description="Memorize and recreate visual patterns on a grid. Strengthens visual memory.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="quick_math",
        name="Quick Math",
        cognitive_domain="Executive Function",
        description="Solve arithmetic problems under time pressure. Boosts mental calculation speed.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="word_scramble",
        name="Word Scramble",
        cognitive_domain="Language",
        description="Unscramble letters to form valid words. Enhances vocabulary and verbal reasoning.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="simon_says",
        name="Simon Says",
        cognitive_domain="Memory",
        description="Remember and repeat increasingly long color sequences. Classic sequential recall.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="card_matching",
        name="Card Matching",
        cognitive_domain="Memory",
        description="Find matching pairs in a grid of face-down cards. Trains visual memory.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="reaction_time",
        name="Reaction Time",
        cognitive_domain="Processing Speed",
        description="Click as fast as possible when the screen changes color. Measures reflexes.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="number_sequence",
        name="Number Sequence",
        cognitive_domain="Problem Solving",
        description="Identify patterns and predict the next number. Develops logical reasoning.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="dual_task",
        name="Dual Task Challenge",
        cognitive_domain="Executive Function",
        description="Count shapes while solving math problems simultaneously. Tests divided attention.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="visual_search",
        name="Visual Search",
        cognitive_domain="Attention",
        description="Find target shapes among distractors as quickly as possible.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="anagram_solver",
        name="Anagram Solver",
        cognitive_domain="Language",
        description="Rearrange letters to form words before time runs out.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="trail_making",
        name="Trail Making",
        cognitive_domain="Executive Function",
        description="Connect numbers and letters in alternating sequence. Tests cognitive flexibility.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="working_memory_grid",
        name="Working Memory Grid",
        cognitive_domain="Memory",
        description="Remember positions of highlighted cells on a grid. Trains spatial working memory.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="delayed_recall",
        name="Delayed Recall",
        cognitive_domain="Memory",
        description="Study a word list, do a brief distractor task, then recall the words.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="daily_routine_recall",
        name="Daily Routine Recall",
        cognitive_domain="Memory",
        description="Arrange daily activities into their correct chronological order from morning to night.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
    GameTypeInfo(
        id="cultural_object_recognition",
        name="Cultural Object Recognition",
        cognitive_domain="Memory",
        description="Recognize, identify, and recall traditional Northeast Indian heritage symbols and artifacts.",
        difficulties=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    ),
]


def get_available_game_types() -> list[GameTypeInfo]:
    return AVAILABLE_GAMES


def record_game_session(
    db: Session,
    patient_id: UUID,
    data: GameSessionCreate,
) -> GameSession:
    completed_time = data.completed_at or datetime.now(timezone.utc)
    metrics_str = json.dumps(data.metrics) if data.metrics else None

    session = GameSession(
        patient_id=patient_id,
        game_type=data.game_type,
        game_id=data.game_id,
        score=data.score,
        accuracy=data.accuracy,
        duration_seconds=data.duration_seconds,
        difficulty=data.difficulty,
        level_achieved=data.level_achieved,
        metrics=metrics_str,
        completed_at=completed_time,
    )

    try:
        db.add(session)
        db.commit()
        db.refresh(session)
        is_won = session.accuracy >= 60.0 or session.score >= 40
        session.next_level_unlocked = min(10, session.level_achieved + 1) if is_won else session.level_achieved
        return session
    except Exception:
        db.rollback()
        raise


def get_patient_game_sessions(
    db: Session,
    patient_id: UUID,
    game_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[GameSession]:
    query = (
        select(GameSession)
        .where(GameSession.patient_id == patient_id)
        .order_by(GameSession.completed_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if game_type:
        query = query.where(GameSession.game_type == game_type)

    return list(db.scalars(query).all())


def get_patient_game_progress(
    db: Session,
    patient_id: UUID,
) -> dict[str, dict]:
    """Calculate the unlocked level and best score for each game played by the patient."""
    sessions = db.scalars(
        select(GameSession)
        .where(GameSession.patient_id == patient_id)
        .order_by(GameSession.completed_at.asc())
    ).all()

    progress_map: dict[str, dict] = {}

    for s in sessions:
        gid = s.game_id or s.game_type
        # A level is considered won/completed if accuracy >= 60% or score >= 40
        is_won = s.accuracy >= 60.0 or s.score >= 40

        if gid not in progress_map:
            progress_map[gid] = {
                "game_id": gid,
                "highest_level_won": s.level_achieved if is_won else 0,
                "current_unlocked_level": min(10, s.level_achieved + 1) if is_won else 1,
                "best_score": s.score,
                "total_played": 1,
                "last_played": s.completed_at,
            }
        else:
            prog = progress_map[gid]
            prog["total_played"] += 1
            prog["last_played"] = s.completed_at
            if s.score > prog["best_score"]:
                prog["best_score"] = s.score
            if is_won and s.level_achieved >= prog["highest_level_won"]:
                prog["highest_level_won"] = s.level_achieved
                prog["current_unlocked_level"] = min(10, s.level_achieved + 1)

    return progress_map


def get_patient_game_summary(
    db: Session,
    patient_id: UUID,
) -> dict:
    sessions = (
        db.scalars(
            select(GameSession)
            .where(GameSession.patient_id == patient_id)
            .order_by(GameSession.completed_at.desc())
        )
        .all()
    )

    total_sessions = len(sessions)
    if total_sessions == 0:
        return {
            "total_sessions": 0,
            "average_score": 0.0,
            "average_accuracy": 0.0,
            "total_duration_seconds": 0,
            "games_played": [],
            "recent_sessions": [],
        }

    avg_score = sum(s.score for s in sessions) / total_sessions
    avg_accuracy = sum(s.accuracy for s in sessions) / total_sessions
    total_duration = sum(s.duration_seconds for s in sessions)
    games_played = sorted(list({s.game_type for s in sessions}))

    # Map sessions with next_level_unlocked populated
    formatted_sessions = []
    for s in sessions[:5]:
        is_won = s.accuracy >= 60.0 or s.score >= 40
        s_dict = {
            "id": s.id,
            "patient_id": s.patient_id,
            "game_type": s.game_type,
            "game_id": s.game_id,
            "score": s.score,
            "accuracy": s.accuracy,
            "duration_seconds": s.duration_seconds,
            "difficulty": s.difficulty,
            "level_achieved": s.level_achieved,
            "next_level_unlocked": min(10, s.level_achieved + 1) if is_won else s.level_achieved,
            "metrics": s.metrics,
            "completed_at": s.completed_at,
            "created_at": s.created_at,
        }
        formatted_sessions.append(s_dict)

    return {
        "total_sessions": total_sessions,
        "average_score": round(avg_score, 2),
        "average_accuracy": round(avg_accuracy, 2),
        "total_duration_seconds": total_duration,
        "games_played": games_played,
        "recent_sessions": formatted_sessions,
    }
