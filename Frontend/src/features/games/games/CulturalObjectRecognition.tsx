import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, HelpCircle, MapPin, Sparkles, XCircle } from "lucide-react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useLanguage } from "@/context/LanguageContext";
import { CULTURAL_OBJECTS, type CulturalObject } from "../data/culturalObjects";
import { GameVoiceInputButton } from "../components/GameVoiceInputButton";

export interface CulturalObjectRecognitionProps {
  level: number;
}

interface RoundData {
  target: CulturalObject;
  options: CulturalObject[]; // for multiple-choice mode
}

const TOTAL_ROUNDS = 5;

export default function CulturalObjectRecognition({ level }: CulturalObjectRecognitionProps) {
  const { t } = useLanguage();
  const { submitResult } = useGameSession();

  // Low levels (1-4): Multiple Choice, High levels (5-10): Typed / Recall
  const isMultipleChoice = level <= 4;
  const choicesCount = level <= 2 ? 3 : 4;

  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [typedInput, setTypedInput] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [roundAnswered, setRoundAnswered] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);

  const saved = useRef(false);
  const sessionStart = useRef(Date.now());

  const initGame = useCallback(() => {
    // Pick 5 distinct objects for the rounds
    const shuffledObjects = [...CULTURAL_OBJECTS].sort(() => Math.random() - 0.5);
    const roundTargets = shuffledObjects.slice(0, TOTAL_ROUNDS);

    const generatedRounds: RoundData[] = roundTargets.map((target) => {
      // Pick distractor options from the remaining objects
      const others = CULTURAL_OBJECTS.filter((o) => o.id !== target.id).sort(
        () => Math.random() - 0.5,
      );
      const options = [target, ...others.slice(0, choicesCount - 1)].sort(
        () => Math.random() - 0.5,
      );
      return { target, options };
    });

    setRounds(generatedRounds);
    setCurrentRoundIdx(0);
    setTypedInput("");
    setSelectedOptionId(null);
    setRoundAnswered(false);
    setIsCurrentCorrect(false);
    setCorrectCount(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [choicesCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const currentRound = rounds[currentRoundIdx];

  // Submit multiple-choice selection
  const handleSelectOption = (option: CulturalObject) => {
    if (roundAnswered || !currentRound) return;

    setSelectedOptionId(option.id);
    const correct = option.id === currentRound.target.id;
    setIsCurrentCorrect(correct);
    if (correct) {
      setCorrectCount((c) => c + 1);
    }
    setRoundAnswered(true);
  };

  const getTargetName = (obj: CulturalObject) => t(obj.nameKey, { defaultValue: obj.name });
  const getTargetState = (obj: CulturalObject) => t(obj.stateKey, { defaultValue: obj.state });
  const getTargetDesc = (obj: CulturalObject) =>
    t(obj.descriptionKey, { defaultValue: obj.description });
  const getTargetStory = (obj: CulturalObject) =>
    t(obj.culturalNoteKey, { defaultValue: obj.culturalNote });

  // Submit free recall typed or voice answer
  const handleSubmitTypedAnswer = (overrideText?: string) => {
    if (roundAnswered || !currentRound) return;
    const raw = overrideText !== undefined ? overrideText : typedInput;
    const cleanInput = raw.trim().normalize("NFC").toLowerCase();
    if (!cleanInput) return;

    const target = currentRound.target;
    const locName = getTargetName(target).trim().normalize("NFC").toLowerCase();
    const origName = target.name.trim().normalize("NFC").toLowerCase();

    // Match against localized name, original English name, or keywords
    const matchesName =
      locName.includes(cleanInput) ||
      cleanInput.includes(locName) ||
      origName.includes(cleanInput) ||
      cleanInput.includes(origName);

    const matchesKeyword = target.keywords.some((kw) => {
      const cleanKw = kw.trim().normalize("NFC").toLowerCase();
      return cleanKw.includes(cleanInput) || cleanInput.includes(cleanKw);
    });

    const correct = matchesName || matchesKeyword;

    setIsCurrentCorrect(correct);
    if (correct) {
      setCorrectCount((c) => c + 1);
    }
    setRoundAnswered(true);
  };

  // Next round or final submission
  const handleNextRound = () => {
    if (currentRoundIdx + 1 < rounds.length) {
      setCurrentRoundIdx((idx) => idx + 1);
      setTypedInput("");
      setSelectedOptionId(null);
      setRoundAnswered(false);
      setIsCurrentCorrect(false);
    } else {
      // Game completed!
      if (!saved.current) {
        saved.current = true;
        const total = rounds.length;
        const acc = Math.round((correctCount / total) * 100);
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);

        submitResult({
          gameId: "cultural-object-recognition",
          gameType: "cultural_object_recognition",
          score: acc,
          accuracy: acc,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
          metrics: {
            correctRounds: correctCount,
            totalRounds: total,
            mode: isMultipleChoice ? "multiple_choice" : "free_recall",
          },
        }).then((res) => {
          setSynced(res.success);
          setOffline(res.offline);
          setCompleted(true);
        });
      }
    }
  };

  if (completed) {
    const acc = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    return (
      <>
        <CelebrationAnimation show={acc >= 60} />
        <GameResults
          score={acc}
          accuracy={acc}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName={t("games:culturalObjectRecognitionTitle")}
          synced={synced}
          offline={offline}
          onPlayAgain={initGame}
        />
      </>
    );
  }

  if (!currentRound) {
    return (
      <div className="py-12 text-center text-cream/70 animate-pulse">{t("common:loading")}</div>
    );
  }

  const { target, options } = currentRound;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Round Progress Tracker */}
      <div className="flex items-center justify-between text-xs font-semibold text-cream/70 border-b border-clay/50 pb-3">
        <span className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-sun" />
          {t("games:roundProgress", { current: currentRoundIdx + 1, total: TOTAL_ROUNDS })}
        </span>
        <span className="bg-clay/40 px-2.5 py-1 rounded-full text-cream/80">
          Score: {correctCount} / {currentRoundIdx + (roundAnswered ? 1 : 0)}
        </span>
      </div>

      {/* Target Cultural Object Showcase */}
      <div className="rounded-3xl border-2 border-clay bg-ink/70 p-6 sm:p-8 text-center space-y-4 shadow-card">
        {/* Placeholder Emoji Icon (to be replaced with photo asset in production) */}
        <div className="relative inline-flex items-center justify-center size-28 sm:size-32 rounded-3xl bg-sun/10 border-2 border-sun/30 mx-auto shadow-inner">
          <span className="text-6xl sm:text-7xl select-none" aria-hidden="true">
            {target.icon}
          </span>
          <span className="absolute -bottom-2.5 bg-clay/90 border border-sun/40 text-cream/90 text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
            <MapPin size={10} className="text-sun" />
            {getTargetState(target)}
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-cream">
            {roundAnswered
              ? getTargetName(target)
              : isMultipleChoice
                ? t("games:culturalQuestion")
                : t("games:typeAnswerPrompt")}
          </h2>
          <p className="text-xs text-cream/60 mt-1 max-w-md mx-auto">
            {roundAnswered
              ? getTargetDesc(target)
              : "Observe the shapes, craft, and regional origin"}
          </p>
        </div>
      </div>

      {/* Mode A: Multiple Choice Selection */}
      {isMultipleChoice && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isTarget = option.id === target.id;

              let style = "border-clay bg-surface hover:border-sun/60 hover:bg-clay/30 text-cream";
              if (roundAnswered) {
                if (isTarget) {
                  style =
                    "border-tea-confirm bg-tea-confirm/20 text-cream font-bold ring-2 ring-tea-confirm/40";
                } else if (isSelected) {
                  style = "border-fire bg-fire/20 text-cream line-through";
                } else {
                  style = "border-clay/40 bg-ink/30 text-cream/40 opacity-60";
                }
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={roundAnswered}
                  className={`p-4 rounded-2xl border-2 font-bold text-base transition-all text-left flex items-center justify-between shadow-sm ${style}`}
                >
                  <span>{getTargetName(option)}</span>
                  {roundAnswered && isTarget && (
                    <CheckCircle2 size={18} className="text-tea-confirm shrink-0" />
                  )}
                  {roundAnswered && isSelected && !isTarget && (
                    <XCircle size={18} className="text-fire shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode B: Free Recall Typed Input with Voice Input */}
      {!isMultipleChoice && !roundAnswered && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitTypedAnswer();
              }}
              className="flex-1 rounded-xl border-2 border-clay bg-ink text-cream font-bold py-3 px-4 focus:border-sun focus:outline-none text-base sm:text-lg"
              placeholder="e.g. Gamusa, Jaapi, Rhino…"
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleSubmitTypedAnswer()}
              disabled={!typedInput.trim()}
              className="px-6 py-3 rounded-xl bg-sun text-ink font-bold hover:opacity-90 disabled:opacity-40 transition shrink-0"
            >
              {t("games:submitAnswer")}
            </button>
            <GameVoiceInputButton
              onTranscript={(spoken) => {
                setTypedInput(spoken);
                handleSubmitTypedAnswer(spoken);
              }}
              disabled={roundAnswered}
            />
          </div>
          <p className="text-xs text-cream/40 text-center flex items-center justify-center gap-1">
            <HelpCircle size={12} />
            Tip: Spell as closely as you remember or tap the microphone to speak
          </p>
        </div>
      )}

      {/* Answer Feedback & Cultural Story Card */}
      {roundAnswered && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              isCurrentCorrect
                ? "border-tea-confirm/50 bg-tea-confirm/10 text-tea-confirm"
                : "border-fire/50 bg-fire/10 text-cream"
            }`}
          >
            {isCurrentCorrect ? (
              <CheckCircle2 size={24} className="text-tea-confirm shrink-0 mt-0.5" />
            ) : (
              <XCircle size={24} className="text-fire shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-extrabold text-base">
                {isCurrentCorrect ? t("games:correct") : t("games:incorrect")}
              </p>
              {!isCurrentCorrect && (
                <p className="text-cream/80 mt-0.5">
                  This is the <span className="font-bold text-sun">{getTargetName(target)}</span>{" "}
                  from {getTargetState(target)}.
                </p>
              )}
            </div>
          </div>

          {/* Rich Cultural Story */}
          <div className="rounded-2xl border border-clay bg-surface/80 p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sun">
              <Sparkles size={14} />
              {t("games:culturalHeritageNote")}
            </div>
            <p className="text-sm text-cream/90 leading-relaxed">{getTargetStory(target)}</p>
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNextRound}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 transition shadow-card"
            >
              {currentRoundIdx + 1 < TOTAL_ROUNDS ? t("games:nextObject") : t("common:done")}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
