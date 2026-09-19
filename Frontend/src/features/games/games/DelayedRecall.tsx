import { useEffect, useRef, useState, useMemo } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";
import { useLanguage } from "@/context/LanguageContext";
import { getGameWordPool } from "../data/wordPools";
import { GameVoiceInputButton } from "../components/GameVoiceInputButton";

const getWordCount = (level: number) => Math.min(3 + Math.floor(level / 2), 8);

type Phase = "study" | "distract" | "recall";

export default function DelayedRecall({ level }: { level: number }) {
  const { shortLang, t } = useLanguage();
  const tierIndex = Math.min(Math.floor((level - 1) / 2.5), 3);
  const wordList = useMemo(
    () => getGameWordPool("delayed-recall", shortLang, tierIndex),
    [shortLang, tierIndex],
  );

  const wordCount = getWordCount(level);
  const studyTime = Math.max(3000, 6000 - level * 300);
  const distractTime = Math.max(5000, 8000 - level * 200);

  const [words, setWords] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("study");
  const [distractNum, setDistractNum] = useState(1);
  const [input, setInput] = useState("");
  const [recalled, setRecalled] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  // Reset words whenever level or wordList changes
  useEffect(() => {
    setWords([...wordList].sort(() => Math.random() - 0.5).slice(0, wordCount));
    setPhase("study");
    setDistractNum(1);
    setInput("");
    setRecalled([]);
    setSubmitted(false);
    setCompleted(false);
    saved.current = false;
  }, [wordList, wordCount]);

  useEffect(() => {
    if (phase !== "study") return;
    sessionStart.current = Date.now();
    const study = setTimeout(() => setPhase("distract"), studyTime);
    return () => clearTimeout(study);
  }, [phase, studyTime]);

  useEffect(() => {
    if (phase !== "distract") return;
    const interval = setInterval(() => setDistractNum((n) => n + 1), 1000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPhase("recall");
    }, distractTime);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phase, distractTime]);

  const addWord = (overrideInput?: string) => {
    const rawWord = overrideInput !== undefined ? overrideInput : input;
    const cleanWord = rawWord.trim();
    if (!cleanWord) return;

    if (!recalled.some((w) => w.toLowerCase() === cleanWord.toLowerCase())) {
      setRecalled((r) => [...r, cleanWord]);
    }
    setInput("");
  };

  const submitRecall = () => {
    if (submitted) return;
    setSubmitted(true);
    const normalizedTargets = words.map((w) => w.trim().normalize("NFC").toLowerCase());
    const correct = recalled.filter((w) =>
      normalizedTargets.includes(w.trim().normalize("NFC").toLowerCase()),
    ).length;
    const acc = Math.round((correct / wordCount) * 100);
    const dur = Math.round((Date.now() - sessionStart.current) / 1000);

    if (!saved.current) {
      saved.current = true;
      submitResult({
        gameId: "delayed-recall",
        gameType: "delayed_recall",
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
    }
  };

  const normalizedTargets = words.map((w) => w.trim().normalize("NFC").toLowerCase());
  const correct = recalled.filter((w) =>
    normalizedTargets.includes(w.trim().normalize("NFC").toLowerCase()),
  ).length;
  const finalAccuracy = Math.round((correct / (wordCount || 1)) * 100);
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  const resetGame = () => {
    setWords([...wordList].sort(() => Math.random() - 0.5).slice(0, wordCount));
    setPhase("study");
    setDistractNum(1);
    setInput("");
    setRecalled([]);
    setSubmitted(false);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  };

  const phaseLabel =
    phase === "study"
      ? "Phase 1: Memorise"
      : phase === "distract"
        ? "Phase 2: Distractor"
        : "Phase 3: Recall";

  return (
    <GameShell
      gameId="delayed-recall"
      level={level}
      stats={[
        { label: "Phase", value: phaseLabel, highlight: phase === "recall" ? "tea" : "sun" },
        { label: "Target Words", value: wordCount },
        ...(phase === "recall"
          ? [{ label: "Recalled", value: recalled.length, highlight: "sun" as const }]
          : []),
      ]}
      instructionHint={
        phase === "study"
          ? "Memorise the words before time runs out"
          : phase === "distract"
            ? "Follow along with the counter"
            : "Type or speak the words you remember"
      }
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
      <div className="space-y-6">
        {phase === "study" && (
          <div className="text-center space-y-5 py-4">
            <p className="text-cream/80 text-base font-medium">Memorise these {wordCount} words:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {words.map((w) => (
                <span
                  key={w}
                  className="px-5 py-3 rounded-2xl border-2 border-sun bg-sun/15 font-display text-2xl font-black text-sun shadow-sm"
                >
                  {w}
                </span>
              ))}
            </div>
            <p className="text-sm text-cream/50 animate-pulse font-medium">
              Study carefully: moving to distractor task in a moment…
            </p>
          </div>
        )}

        {phase === "distract" && (
          <div className="text-center space-y-5 py-6">
            <p className="text-cream/80 text-base font-medium">
              Count along: (this is your distractor task)
            </p>
            <p className="font-display text-8xl font-black text-fire animate-pulse">
              {distractNum}
            </p>
            <p className="text-sm text-cream/50 animate-pulse font-medium">
              Hold the words in your memory…
            </p>
          </div>
        )}

        {phase === "recall" && !submitted && (
          <div className="space-y-6 max-w-lg mx-auto py-2">
            <p className="text-cream/80 text-base font-medium text-center">
              Type or speak all the words you remember, one by one:
            </p>
            <div className="flex gap-2 flex-wrap justify-center min-h-[44px]">
              {recalled.map((w) => (
                <span
                  key={w}
                  className="px-3.5 py-1.5 rounded-xl border border-tea-confirm bg-tea-confirm/15 text-tea-confirm font-bold text-base shadow-sm"
                >
                  {w}
                </span>
              ))}
            </div>
            <div className="flex gap-2.5 justify-center items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addWord();
                }}
                className="rounded-xl border-2 border-clay bg-ink text-cream font-bold py-3 px-4 w-60 focus:border-sun focus:outline-none text-lg min-h-[48px]"
                placeholder="Type a word…"
                autoFocus
              />
              <button
                onClick={() => addWord()}
                className="px-6 py-3 min-h-[48px] min-w-[48px] rounded-xl bg-clay text-cream font-bold hover:bg-clay/80 active:scale-95 active:bg-clay/60 transition touch-manipulation flex items-center justify-center shadow-sm"
              >
                Add
              </button>
              <GameVoiceInputButton
                onTranscript={(spoken) => {
                  setInput(spoken);
                  addWord(spoken);
                }}
                disabled={submitted}
              />
            </div>
            <div className="flex justify-center pt-2">
              <button
                onClick={submitRecall}
                className="px-8 py-3.5 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-black text-base hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation flex items-center justify-center gap-2"
              >
                ✓ I'm Done — Submit Words
              </button>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
