import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, HelpCircle, MapPin, Sparkles, XCircle } from "lucide-react";
import { GameShell } from "../components/GameShell";
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

  const getTargetName = (obj: CulturalObject) => {
    return t(obj.nameKey as any) || obj.name;
  };

  const getTargetState = (obj: CulturalObject) => {
    return t(obj.stateKey as any) || obj.state;
  };

  const getTargetStory = (obj: CulturalObject) => {
    return t(obj.culturalNoteKey as any) || obj.culturalNote;
  };

  // Multiple-choice click
  const handleSelectOption = (option: CulturalObject) => {
    if (roundAnswered || !currentRound) return;

    setSelectedOptionId(option.id);
    setRoundAnswered(true);

    const correct = option.id === currentRound.target.id;
    setIsCurrentCorrect(correct);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  // Free-recall submit
  const handleSubmitTypedAnswer = (overrideInput?: string) => {
    if (roundAnswered || !currentRound) return;

    const rawAnswer = overrideInput !== undefined ? overrideInput : typedInput;
    const cleanAnswer = rawAnswer.trim().normalize("NFC").toLowerCase();
    if (!cleanAnswer) return;

    setRoundAnswered(true);

    const target = currentRound.target;
    // Check against all localized aliases
    const aliases = [
      target.name.toLowerCase(),
      ...(target.keywords || []).map((k: string) => k.toLowerCase()),
    ];

    const correct = aliases.some(
      (alias) =>
        cleanAnswer === alias || cleanAnswer.includes(alias) || alias.includes(cleanAnswer),
    );

    setIsCurrentCorrect(correct);
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  // Advance to next round or complete session
  const handleNextRound = () => {
    if (currentRoundIdx + 1 < TOTAL_ROUNDS) {
      setCurrentRoundIdx((prev) => prev + 1);
      setTypedInput("");
      setSelectedOptionId(null);
      setRoundAnswered(false);
      setIsCurrentCorrect(false);
    } else {
      // Completed all rounds
      if (!saved.current) {
        saved.current = true;
        const total = TOTAL_ROUNDS;
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

  const finalAccuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  if (!currentRound) {
    return (
      <div className="py-12 text-center text-cream/70 animate-pulse font-sans">
        {t("common:loading")}
      </div>
    );
  }

  const { target, options } = currentRound;

  return (
    <GameShell
      gameId="cultural-object-recognition"
      level={level}
      score={correctCount}
      targetScore={TOTAL_ROUNDS}
      stats={[{ label: "Round", value: `${currentRoundIdx + 1} / ${TOTAL_ROUNDS}` }]}
      instructionHint={
        isMultipleChoice ? "Identify the cultural artifact" : "Type or speak the artifact name"
      }
      completed={completed}
      results={{
        score: finalAccuracy,
        accuracy: finalAccuracy,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={initGame}
    >
      <div className="space-y-6 max-w-xl mx-auto">
        {/* Target Cultural Object Showcase */}
        <div className="rounded-3xl border-2 border-clay bg-ink/70 p-6 sm:p-8 text-center space-y-4 shadow-card">
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
              {roundAnswered ? getTargetName(target) : t("games:whichObjectIsThis")}
            </h2>
            <p className="text-xs sm:text-sm text-cream/60 mt-1 max-w-sm mx-auto">
              {getTargetState(target)}
            </p>
          </div>
        </div>

        {/* Interaction Mode A: Multiple Choice */}
        {isMultipleChoice && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isCorrectOption = option.id === target.id;

              let btnStyle =
                "border-clay bg-surface hover:border-sun/60 hover:bg-clay/40 text-cream";

              if (roundAnswered) {
                if (isCorrectOption) {
                  btnStyle =
                    "border-tea-confirm bg-tea-confirm/20 text-cream font-bold ring-2 ring-tea-confirm/50";
                } else if (isSelected && !isCorrectOption) {
                  btnStyle = "border-fire bg-fire/20 text-cream/80 line-through";
                } else {
                  btnStyle = "border-clay/40 bg-surface/40 text-cream/40 opacity-50";
                }
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={roundAnswered}
                  className={`p-4 rounded-2xl border-2 text-left font-semibold text-base transition-all flex items-center justify-between min-h-[52px] touch-manipulation select-none active:scale-[0.98] ${btnStyle}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>{getTargetName(option)}</span>
                  </span>
                  {roundAnswered && isCorrectOption && (
                    <CheckCircle2 size={20} className="text-tea-confirm shrink-0" />
                  )}
                  {roundAnswered && isSelected && !isCorrectOption && (
                    <XCircle size={20} className="text-fire shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Interaction Mode B: Free Recall / Typed + Voice Input */}
        {!isMultipleChoice && (
          <div className="space-y-4">
            <div className="flex gap-2.5 items-center">
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitTypedAnswer();
                }}
                disabled={roundAnswered}
                placeholder={t("games:typeArtifactName")}
                className="flex-1 rounded-2xl border-2 border-clay bg-surface/80 px-4 py-3 text-base text-cream placeholder:text-cream/40 focus:border-sun focus:outline-none disabled:opacity-50 min-h-[48px]"
              />
              <button
                type="button"
                onClick={() => handleSubmitTypedAnswer()}
                disabled={roundAnswered || !typedInput.trim()}
                className="px-6 py-3 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-bold hover:opacity-90 active:scale-95 active:opacity-90 disabled:opacity-40 transition shrink-0 touch-manipulation"
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
            <div className="rounded-2xl border border-clay bg-surface/80 p-4 sm:p-5 space-y-2 shadow-sm">
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
                className="flex items-center gap-2 px-6 py-3 min-h-[48px] min-w-[48px] rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 active:scale-95 active:opacity-90 transition shadow-md touch-manipulation"
              >
                <span>
                  {currentRoundIdx + 1 < TOTAL_ROUNDS ? t("games:nextObject") : t("common:done")}
                </span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
