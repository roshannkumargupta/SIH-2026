import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useLanguage } from "@/context/LanguageContext";
import { getGameWordPool, getGraphemes, scrambleWord } from "../data/wordPools";
import { GameVoiceInputButton } from "../components/GameVoiceInputButton";

export default function AnagramSolver({ level }: { level: number }) {
  const { shortLang, t } = useLanguage();
  const tierIndex = Math.min(Math.floor((level - 1) / 2.5), 3);

  const pool = useMemo(() => {
    const tierWords = getGameWordPool("anagram-solver", shortLang, tierIndex);
    if (tierWords && tierWords.length > 0) return tierWords;
    return getGameWordPool("anagram-solver", "en", tierIndex);
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

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    pick();
  }, [level, pool]);

  const submit = (overrideInput?: string) => {
    if (completed || !word) return;
    const rawGuess = overrideInput !== undefined ? overrideInput : input;
    const cleanGuess = rawGuess.trim().normalize("NFC").toLowerCase();
    const cleanTarget = word.trim().normalize("NFC").toLowerCase();

    if (cleanGuess === cleanTarget) {
      const newScore = score + 1;
      setScore(newScore);
      setFeedback("✓ Correct!");
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "anagram-solver",
          gameType: "anagram_solver",
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
        setTimeout(pick, 700);
      }
    } else {
      setFeedback("✗ Wrong — the answer was: " + word);
      setTimeout(pick, 1200);
    }
  };

  const scrambledTiles = useMemo(() => {
    return getGraphemes(scr, shortLang);
  }, [scr, shortLang]);

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName={t("games:anagramSolverTitle", { defaultValue: "Anagram Solver" })}
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
            pick();
          }}
        />
      </>
    );

  return (
    <div className="space-y-6 text-center">
      <p className="text-cream/50 text-xs uppercase font-bold">
        Score: {score}/{target}
      </p>
      <p className="text-cream/60 text-sm">Unscramble these letters to form a real word:</p>
      <div className="flex justify-center gap-2 flex-wrap">
        {scrambledTiles.map((letter, i) => (
          <span
            key={i}
            className="flex min-w-12 h-12 px-2 items-center justify-center rounded-xl border-2 border-sun bg-sun/10 font-display text-2xl font-black text-sun"
          >
            {letter.toUpperCase()}
          </span>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl font-bold py-3 px-4 w-full max-w-xs focus:border-sun focus:outline-none"
          placeholder="Type or speak answer…"
          disabled={completed}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => submit()}
            disabled={completed}
            className="px-6 py-3 rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 disabled:opacity-40 transition shadow"
          >
            Submit
          </button>
          <GameVoiceInputButton
            onTranscript={(spoken) => {
              setInput(spoken);
              submit(spoken);
            }}
            disabled={completed}
          />
        </div>
      </div>
      {feedback && (
        <p
          className={`text-sm font-bold ${feedback.startsWith("✓") ? "text-tea-confirm" : "text-fire"}`}
        >
          {feedback}
        </p>
      )}
      <button onClick={pick} className="text-xs text-cream/40 underline">
        Skip
      </button>
    </div>
  );
}
