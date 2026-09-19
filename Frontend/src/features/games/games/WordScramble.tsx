import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";
import { useLanguage } from "@/context/LanguageContext";
import { getGameWordPool, scrambleWord } from "../data/wordPools";
import { GameVoiceInputButton } from "../components/GameVoiceInputButton";

export default function WordScramble({ level }: { level: number }) {
  const { shortLang } = useLanguage();
  const tierIndex = Math.min(Math.floor((level - 1) / 2.5), 3);

  const pool = useMemo(() => {
    const tierWords = getGameWordPool("word-scramble", shortLang, tierIndex);
    if (tierWords && tierWords.length > 0) return tierWords;
    // Fallback to English
    return getGameWordPool("word-scramble", "en", tierIndex);
  }, [shortLang, tierIndex]);

  const [word, setWord] = useState("");
  const [scr, setScr] = useState("");
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level / 2));
  const { submitResult } = useGameSession();

  const pick = () => {
    if (!pool || pool.length === 0) return;
    const w = pool[Math.floor(Math.random() * pool.length)]!;
    setWord(w);
    setScr(scrambleWord(w, shortLang));
    setInput("");
    setFeedback("");
  };

  const resetGame = () => {
    setCompleted(false);
    setScore(0);
    saved.current = false;
    setSynced(false);
    setOffline(false);
    sessionStart.current = Date.now();
    pick();
  };

  useEffect(() => {
    resetGame();
  }, [level, pool]);

  const submitGuess = (overrideGuess?: string) => {
    if (completed || !word) return;
    const rawGuess = overrideGuess !== undefined ? overrideGuess : input;
    const cleanGuess = rawGuess.trim().normalize("NFC").toLowerCase();
    const cleanTarget = word.trim().normalize("NFC").toLowerCase();

    if (cleanGuess === cleanTarget) {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "word-scramble",
          gameType: "word_scramble",
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
      } else {
        setFeedback("✓ Correct!");
        setTimeout(pick, 700);
      }
    } else {
      setFeedback("✗ Wrong — try again!");
      setScore((s) => Math.max(0, s - 1));
      setTimeout(() => setFeedback(""), 900);
    }
  };

  const finalScore = Math.min(100, Math.round((score / target) * 100));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  return (
    <GameShell
      gameId="word-scramble"
      level={level}
      score={score}
      targetScore={target}
      feedback={feedback || null}
      instructionHint="Unscramble the letters into a meaningful word. Type your answer or tap the microphone to speak."
      completed={completed}
      results={{
        score: finalScore,
        accuracy: finalScore,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={resetGame}
      onNextLevel={
        level < 10
          ? () => {
              window.location.href = `/games/word-scramble?level=${level + 1}`;
            }
          : undefined
      }
    >
      <div className="space-y-6 text-center max-w-md mx-auto">
        <div className="inline-block rounded-2xl border-4 border-sun bg-ink px-8 py-5 shadow-card">
          <span className="font-display text-4xl sm:text-5xl font-black text-sun tracking-widest">
            {scr.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitGuess();
            }}
            className="rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl font-bold py-3 px-4 w-full focus:border-sun focus:outline-none"
            placeholder="Type or speak answer…"
            disabled={completed}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => submitGuess()}
              disabled={completed}
              className="px-6 py-3 min-h-[48px] rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 active:scale-95 disabled:opacity-40 transition shadow touch-manipulation cursor-pointer"
            >
              ✓ Submit
            </button>
            <GameVoiceInputButton
              onTranscript={(spoken) => {
                setInput(spoken);
                submitGuess(spoken);
              }}
              disabled={completed}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={pick}
            className="text-xs text-cream/50 underline min-h-[44px] px-4 py-2 rounded-lg hover:text-cream active:scale-95 transition touch-manipulation cursor-pointer"
          >
            Skip this word →
          </button>
        </div>
      </div>
    </GameShell>
  );
}
