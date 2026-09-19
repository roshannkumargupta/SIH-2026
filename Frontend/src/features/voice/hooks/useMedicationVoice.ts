import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getLanguageCapability } from "../config/languageRegistry";
import { useVoiceAssistant } from "./useVoiceAssistant";
import { voiceApi } from "../services/voiceApi";

export function useMedicationVoice(language: any) {
  const { t } = useTranslation("voice");
  const voice = useVoiceAssistant(language);
  const [isConfirmingDose, setIsConfirmingDose] = useState<{ logId: string; name: string } | null>(
    null,
  );

  const readScheduleAloud = useCallback(
    async (dictation: string) => {
      const cap = getLanguageCapability(language);
      if (cap.ttsMode === "short-only") return; // Hidden in UI, but double safeguard

      await voice.speak({
        intent: "TODAY_MEDICATIONS" as any,
        fullText: dictation,
        shortKey: "shortPhrases.TODAY_MEDICATIONS",
      });
    },
    [language, voice],
  );

  const readDoseAloud = useCallback(
    async (dose: { name: string; dose: string; time: string; instructions: string }) => {
      const cap = getLanguageCapability(language);
      if (cap.ttsMode === "short-only") return;

      const fullText = `${dose.name}, ${dose.dose}, ${dose.time}, ${dose.instructions}`;
      await voice.speak({
        intent: "NEXT_MEDICATION" as any,
        fullText,
        shortKey: "shortPhrases.NEXT_MEDICATION",
      });
    },
    [language, voice],
  );

  const confirmDoseTaken = useCallback(
    async (logId: string, name: string) => {
      setIsConfirmingDose({ logId, name });
      const fullText = t("responses.MEDICATION_TAKEN", { name }) || `Mark ${name} as taken?`;
      await voice.speak({
        intent: "MEDICATION_TAKEN" as any,
        fullText,
        shortKey: "shortPhrases.CONFIRM_DOSE",
        data: { name },
      });
    },
    [t, voice],
  );

  const executeDoseTaken = useCallback(
    async (logId: string, status: string, onSuccess: () => void) => {
      try {
        await voiceApi.updateMedicationLogVoice(logId, status, true);
        setIsConfirmingDose(null);
        toast.success(t("ui.markedAsTaken") || "Dose marked as taken", {
          action: {
            label: t("ui.undo") || "Undo",
            onClick: () => {
              // Revert logic would go here
            },
          },
          duration: 10000,
        });
        onSuccess();
      } catch (err) {
        toast.error("Failed to update medication log");
      }
    },
    [t],
  );

  const cancelConfirmation = useCallback(() => {
    setIsConfirmingDose(null);
    voice.stopSpeaking();
  }, [voice]);

  return {
    voice,
    readScheduleAloud,
    readDoseAloud,
    confirmDoseTaken,
    isConfirmingDose,
    executeDoseTaken,
    cancelConfirmation,
  };
}
