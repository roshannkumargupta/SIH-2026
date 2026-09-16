import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";

type Puzzle = { question: string; answer: number; hint: string };

const PUZZLES_BY_LEVEL: Puzzle[][] = [
  // Level 1-2: simple
  [
    {
      question: "A farmer has 17 sheep. All but 9 run away. How many are left?",
      answer: 9,
      hint: "'All but 9' means 9 remain.",
    },
    {
      question: "You have 10 candles. 3 blow out. How many candles do you still have?",
      answer: 10,
      hint: "They still exist — just not lit.",
    },
    {
      question:
        "A bat and ball cost $1.10. The bat costs $1 more than the ball. How much does the ball cost?",
      answer: 5,
      hint: "Hint: if ball = X, bat = X+1. X + (X+1) = 1.10 → answer in cents.",
    },
  ],
  // Level 3-5
  [
    {
      question:
        "If 5 machines take 5 minutes to make 5 widgets, how many minutes for 100 machines to make 100 widgets?",
      answer: 5,
      hint: "Each machine makes 1 widget in 5 minutes.",
    },
    {
      question:
        "A lily pad doubles every day. It takes 48 days to cover a lake. How many days to cover half the lake?",
      answer: 47,
      hint: "If it covers all on day 48, it covered half on day 47.",
    },
    {
      question: "I have 6 eggs. I break 2, cook 2, eat 2. How many eggs do I have left?",
      answer: 6,
      hint: "Think carefully — you started with 6.",
    },
  ],
  // Level 6-8
  [
    {
      question:
        "Three friends share a hotel room for $30. Manager says it's $25, refunds $5. Bell boy pockets $2 and gives $1 to each friend. They paid $9 each = $27 + $2 = $29. Where's the missing $1?",
      answer: 0,
      hint: "There is no missing dollar — the framing is misleading.",
    },
    {
      question:
        "A snail climbs 3m per day, slides 2m at night. Wall is 10m. How many days to reach the top?",
      answer: 8,
      hint: "Net gain = 1m/day, but on the day it reaches 10m it doesn't slide back.",
    },
    {
      question:
        "You have two ropes. Each burns in exactly 1 hour (non-uniformly). How do you measure 45 minutes?",
      answer: 45,
      hint: "Light rope 1 at both ends, rope 2 at one end. When rope 1 is done (30min), light rope 2's other end.",
    },
  ],
  // Level 9-10
  [
    {
      question: "What is the next in the series: 1, 1, 2, 3, 5, 8, 13, ?",
      answer: 21,
      hint: "Each number = sum of the two before it (Fibonacci).",
    },
    {
      question: "A clock shows 3:15. What is the angle between hour and minute hands?",
      answer: 8,
      hint: "At 3:15, minute is at 90°, hour is at 97.5°. Difference = 7.5 ≈ 8 (rounded).",
    },
    {
      question: "In a race, you overtake the person in 2nd place. What position are you in now?",
      answer: 2,
      hint: "You took their place — you are now 2nd.",
    },
  ],
];

export default function LogicPuzzles({ level }: { level: number }) {
  const pool = PUZZLES_BY_LEVEL[Math.min(Math.floor((level - 1) / 2.5), 3)]!;
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = pool[puzzleIdx % pool.length]!;
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(2, Math.ceil(level / 3));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    setPuzzleIdx(0);
    setInput("");
    setFeedback("");
    setShowHint(false);
    setAttempts(0);
  }, [level]);

  const submit = () => {
    const val = parseInt(input, 10);
    setAttempts((a) => a + 1);
    if (val === puzzle.answer) {
      setFeedback("✓ Correct!");
      const newScore = score + 1;
      setScore(newScore);
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "logic-puzzles",
          gameType: "logic_puzzles",
          score: acc,
          accuracy: acc,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
          setCompleted(true);
        });
        return;
      }
      setTimeout(() => {
        setPuzzleIdx((i) => i + 1);
        setInput("");
        setFeedback("");
        setShowHint(false);
        setAttempts(0);
      }, 800);
    } else {
      setFeedback(`✗ Not quite. ${attempts >= 1 ? "Hint available below." : "Try again!"}`);
    }
  };

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Logic Puzzles"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            setPuzzleIdx(0);
            setInput("");
            setFeedback("");
            setShowHint(false);
            setAttempts(0);
            sessionStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-5">
      <p className="text-cream/50 text-xs uppercase font-bold text-center">
        Puzzle {puzzleIdx + 1} · Score: {score}/{target}
      </p>
      <div className="rounded-xl border border-sun/40 bg-sun/5 p-5 text-cream/90 text-base leading-relaxed">
        {puzzle.question}
      </div>

      <div className="flex gap-3 items-center justify-center">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="w-28 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl font-bold py-2.5 focus:border-sun focus:outline-none"
          placeholder="?"
          autoFocus
        />
        <button
          onClick={submit}
          className="px-5 py-2.5 rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 transition shadow"
        >
          Submit
        </button>
      </div>

      {feedback && (
        <p
          className={`text-center text-sm font-bold ${feedback.startsWith("✓") ? "text-tea-confirm" : "text-fire"}`}
        >
          {feedback}
        </p>
      )}

      {attempts > 0 && !showHint && (
        <div className="flex justify-center">
          <button onClick={() => setShowHint(true)} className="text-xs text-cream/40 underline">
            💡 Show Hint
          </button>
        </div>
      )}
      {showHint && (
        <div className="rounded-xl border border-sun/30 bg-sun/10 px-4 py-3 text-sm text-cream/80">
          <span className="font-bold text-sun">Hint:</span> {puzzle.hint}
        </div>
      )}
    </div>
  );
}
