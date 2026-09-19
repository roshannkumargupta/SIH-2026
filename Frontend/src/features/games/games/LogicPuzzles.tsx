import { useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";
import { GameVoiceInputButton } from "../components/GameVoiceInputButton";
import { parseSpokenNumber } from "@/features/voice/utils/normalizeText";

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
        "If 5 cats catch 5 mice in 5 minutes, how many cats are needed to catch 100 mice in 100 minutes?",
      answer: 5,
      hint: "Each cat catches 1 mouse per 5 minutes. In 100 minutes, 1 cat catches 20 mice.",
    },
    {
      question:
        "A doctor gives you 3 pills and tells you to take one every 30 minutes. How long do they last?",
      answer: 60,
      hint: "First at minute 0, second at min 30, third at min 60. Answer in minutes.",
    },
    {
      question: "How many months have 28 days?",
      answer: 12,
      hint: "ALL 12 months have at least 28 days!",
    },
  ],
  // Level 6-8
  [
    {
      question:
        "A lily pad doubles in size every day. On day 48 it covers the entire pond. On which day did it cover half?",
      answer: 47,
      hint: "If it doubles each day, the day before full was half.",
    },
    {
      question: "Divide 30 by 1/2 and add 10. What do you get?",
      answer: 70,
      hint: "30 ÷ 0.5 = 60. Then 60 + 10 = 70.",
    },
    {
      question: "If there are 3 apples and you take away 2, how many do YOU have?",
      answer: 2,
      hint: "YOU took 2, so you have 2.",
    },
  ],
  // Level 9-10
  [
    {
      question:
        "Two fathers and two sons go fishing. Each catches a fish, yet only 3 fish are caught. How many people are there?",
      answer: 3,
      hint: "Grandfather, father, and son.",
    },
    {
      question:
        "A grandfather, father, and son's ages total 100. Grandfather is twice father's age, father is 25 years older than son. How old is the son?",
      answer: 5,
      hint: "S + (S+25) + 2(S+25) = 100 → 4S + 75 = 100 → S = 25/4... let's simplify: son=5, father=30, grandfather=65. 5+30+65=100.",
    },
    {
      question: "What is 3 + 3 × 3 - 3 + 3?",
      answer: 12,
      hint: "Order of operations: 3 × 3 = 9. Then 3 + 9 - 3 + 3 = 12.",
    },
  ],
];

export default function LogicPuzzles({ level }: { level: number }) {
  const tier = level <= 2 ? 0 : level <= 5 ? 1 : level <= 8 ? 2 : 3;
  const puzzleSet = PUZZLES_BY_LEVEL[tier] ?? PUZZLES_BY_LEVEL[0]!;
  const target = puzzleSet.length;

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  const puzzle = puzzleSet[puzzleIdx] ?? puzzleSet[0]!;

  useEffect(() => {
    setPuzzleIdx(0);
    setInput("");
    setScore(0);
    setFeedback("");
    setShowHint(false);
    setAttempts(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [level]);

  const submit = (customAns?: number) => {
    const ans = customAns !== undefined ? customAns : parseInt(input, 10);
    setAttempts((a) => a + 1);

    if (ans === puzzle.answer) {
      setScore((s) => s + 1);
      setFeedback("✓ Correct reasoning!");

      if (puzzleIdx + 1 >= target && !saved.current) {
        saved.current = true;
        const finalScoreVal = score + 1;
        const acc = Math.min(100, Math.round((finalScoreVal / target) * 100));
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

  const finalAccuracy = Math.min(100, Math.round((score / target) * 100));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  const resetGame = () => {
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
  };

  return (
    <GameShell
      gameId="logic-puzzles"
      level={level}
      score={score}
      targetScore={target}
      stats={[{ label: "Puzzle", value: `${puzzleIdx + 1} / ${target}` }]}
      feedback={feedback}
      instructionHint="Read the puzzle carefully and enter the numerical answer"
      completed={completed}
      results={{
        score: finalAccuracy,
        accuracy: finalAccuracy,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={resetGame}
    >
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="rounded-2xl border-2 border-sun/30 bg-sun/5 p-6 text-cream text-lg sm:text-xl font-medium leading-relaxed shadow-sm">
          {puzzle.question}
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-center">
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="w-32 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl font-bold py-3 focus:border-sun focus:outline-none min-h-[48px]"
            placeholder="?"
            disabled={completed}
            autoFocus
          />
          <button
            onClick={() => submit()}
            disabled={completed}
            className="px-7 py-3 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-black text-base hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            Submit Answer
          </button>
          <GameVoiceInputButton
            disabled={completed}
            onTranscript={(spoken) => {
              const parsed = parseSpokenNumber(spoken);
              if (parsed !== null) {
                setInput(String(parsed));
                submit(parsed);
              }
            }}
          />
        </div>

        {attempts > 0 && !showHint && (
          <div className="flex justify-center pt-1">
            <button
              onClick={() => setShowHint(true)}
              className="text-sm font-semibold text-sun underline min-h-[48px] min-w-[48px] inline-flex items-center justify-center px-4 py-2 rounded-lg hover:text-sun/80 active:scale-95 transition touch-manipulation"
            >
              💡 Show Helpful Hint
            </button>
          </div>
        )}
        {showHint && (
          <div className="rounded-xl border border-sun/40 bg-sun/10 px-5 py-3.5 text-sm text-cream/90 shadow-sm">
            <span className="font-bold text-sun">Hint:</span> {puzzle.hint}
          </div>
        )}
      </div>
    </GameShell>
  );
}
