import { useState, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { voiceApi } from "../api/voice.api";
import { interpretClientFallback } from "../services/nlpService";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useTextToSpeech } from "./useTextToSpeech";
import { useAuth } from "./use-auth";
import { useTasks } from "./use-tasks";
import { useMedications } from "./use-medications";
import { executeVoiceCommand, getLangKey, LOCALIZED_RESPONSES } from "../utils/voiceCommands";
import type { NlpInterpretation, VoiceCommandExecutionResult, VoiceState } from "../types/voice";

const STATUS_MESSAGES: Record<string, Record<VoiceState, string>> = {
  en: {
    idle: "Ready to listen. Tap the microphone to speak.",
    listening: "Listening… Speak now. It stops automatically when you finish.",
    transcribing: "Sarvam is transcribing your voice…",
    thinking: "Understanding your request…",
    speaking: "Speaking response…",
    error: "Something went wrong. Please try again or type below.",
  },
  hi: {
    idle: "सुनने के लिए तैयार। बोलने के लिए माइक पर टैप करें।",
    listening: "सुन रहा हूँ… बोलना समाप्त होने पर यह अपने आप रुक जाएगा।",
    transcribing: "आपकी आवाज़ पहचानी जा रही है…",
    thinking: "आपकी बात समझ रहा हूँ…",
    speaking: "जवाब सुना रहा हूँ…",
    error: "त्रुटि हुई। कृपया पुनः प्रयास करें या नीचे टाइप करें।",
  },
  as: {
    idle: "শুনিবলৈ সাজু। কথা ক'বলৈ মাইকত স্পৰ্শ কৰক।",
    listening: "শুনি আছোঁ… কথা শেষ হ'লে আপোনা-আপুনি বন্ধ হ'ব।",
    transcribing: "কথা বুজিবলৈ চেষ্টা কৰি আছোঁ…",
    thinking: "কাৰ্য বুজি আছোঁ…",
    speaking: "উত্তৰ দি আছোঁ…",
    error: "সমস্যা হৈছে। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
  },
  bn: {
    idle: "শোনার জন্য প্রস্তুত। কথা বলতে মাইক্রোফোনে ট্যাপ করুন।",
    listening: "শুনছি… বলা শেষ হলে এটি স্বয়ংক্রিয়ভাবে বন্ধ হবে।",
    transcribing: "আপনার কথা অনুধাবন করা হচ্ছে…",
    thinking: "অনুরোধটি বোঝার চেষ্টা করছি…",
    speaking: "উত্তর শোনাচ্ছি…",
    error: "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন বা নিচে লিখুন।",
  },
  mni: {
    idle: "হায়রিবা। শাননবা মাইক নমু।",
    listening: "হায়রিবা… করিবা মতম খুদ্দা।",
    transcribing: "হায়রিবা খংলকপা…",
    thinking: "খংনবা হোৎনরিবা…",
    speaking: "পাউখুম পীরিবা…",
    error: "অশোইবা লৈরে।",
  },
  brx: {
    idle: "হানজায়ো। মাইক বাছ।",
    listening: "হানজায়ো… বায়না ফরায়ো।",
    transcribing: "হায়রিবা খামনি…",
    thinking: "হানজা হোৎনা…",
    speaking: "খামনি বায়না…",
    error: "অসুবিধা জালে।",
  },
  ne: {
    idle: "सुन्न तयार छ। बोल्न माइकमा थिच्नुहोस्।",
    listening: "सुन्दैछु… बोल्न सकेपछि आफैं बन्द हुनेछ।",
    transcribing: "तपाईंको आवाज सुन्दैछ…",
    thinking: "तपाईंको कुरा बुझ्दैछु…",
    speaking: "जवाफ बोल्दैछु…",
    error: "समस्या भयो। कृपया फेरि प्रयास गर्नुहोस्।",
  },
};

export function useVoiceAssistant() {
  const [language, setLanguage] = useState<string>("en-IN");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [lastInterpretation, setLastInterpretation] = useState<NlpInterpretation | null>(null);
  const [lastResult, setLastResult] = useState<VoiceCommandExecutionResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { todayTasks } = useTasks();
  const { todayLogs } = useMedications();
  const { isSpeaking, speak, stop: stopAudio } = useTextToSpeech();

  const isProcessingRef = useRef(false);

  const langKey = getLangKey(language);
  const currentStatusText =
    errorMessage || STATUS_MESSAGES[langKey]?.[voiceState] || STATUS_MESSAGES.en[voiceState];

  const processText = useCallback(
    async (textToProcess: string) => {
      const clean = textToProcess.trim();
      if (!clean || isProcessingRef.current) return;

      isProcessingRef.current = true;
      setErrorMessage(null);
      setTranscript(clean);
      setVoiceState("thinking");

      let interpretation: NlpInterpretation;
      try {
        interpretation = await voiceApi.interpret(clean, language);
      } catch (err) {
        console.warn("Backend NLP call failed, using client fallback:", err);
        interpretation = interpretClientFallback(clean, language);
      }

      setLastInterpretation(interpretation);

      // Execute command
      const execResult = executeVoiceCommand(interpretation, {
        languageCode: language,
        userRole: user?.role,
        todayTasks: todayTasks.map((t) => ({
          id: t.id,
          title: t.title,
          scheduled_time: t.scheduled_time,
          status: t.status,
        })),
        todayMeds: todayLogs.map((l) => ({ id: l.id, status: l.status })),
        navigate,
        stopAudio,
      });

      setLastResult(execResult);

      if (execResult.intent === "STOP_SPEAKING") {
        stopAudio();
        setVoiceState("idle");
        isProcessingRef.current = false;
        return;
      }

      // Voice synthesis
      setVoiceState("speaking");
      speak(execResult.spokenMessage, language, () => {
        setVoiceState("idle");
        isProcessingRef.current = false;
      });
    },
    [language, navigate, speak, stopAudio, todayLogs, todayTasks, user?.role],
  );

  const handleAudioReady = useCallback(
    async (blob: Blob) => {
      setVoiceState("transcribing");
      setErrorMessage(null);

      try {
        const response = await voiceApi.transcribeBlob(blob, language);
        const text = response.transcribed_text || response.text || "";
        if (!text.trim()) {
          throw new Error("No speech recognized. Please speak clearly into the microphone.");
        }
        await processText(text);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Could not transcribe audio. Please try again or type your command.";
        setErrorMessage(msg);
        setVoiceState("error");
        isProcessingRef.current = false;
      }
    },
    [language, processText],
  );

  const speech = useSpeechRecognition({
    onAudioReady: handleAudioReady,
    onError: (err) => {
      setErrorMessage(err.message);
      setVoiceState("error");
    },
    maxDurationMs: 7000,
    silenceThresholdMs: 700,
  });

  const startListening = useCallback(() => {
    stopAudio();
    setErrorMessage(null);
    setTranscript("");
    setVoiceState("listening");
    speech.startRecording();
  }, [speech, stopAudio]);

  const stopListening = useCallback(() => {
    speech.stopRecording();
    setVoiceState("transcribing");
  }, [speech]);

  const toggleListening = useCallback(() => {
    if (voiceState === "listening" || speech.isRecording) {
      stopListening();
    } else {
      startListening();
    }
  }, [speech.isRecording, startListening, stopListening, voiceState]);

  const submitTypedCommand = useCallback(
    async (typedText: string) => {
      stopAudio();
      speech.cancelRecording();
      await processText(typedText);
    },
    [processText, speech, stopAudio],
  );

  const readScreen = useCallback(() => {
    stopAudio();
    const h1 = document.querySelector("h1")?.textContent?.trim() || "";
    const mainText = Array.from(document.querySelectorAll("h2, h3, p"))
      .slice(0, 4)
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .join(". ");

    const lang = getLangKey(language);
    const summaryPrefix = {
      en: `You are on ${h1 || "SmritiSetu"}. Content summary: `,
      hi: `आप ${h1 || "स्मृतिसेतु"} पर हैं। स्क्रीन की जानकारी: `,
      as: `আপুনি ${h1 || "স্মৃতিসেতু"} পৃষ্ঠা চাই আছে। সাৰাংশ: `,
      bn: `আপনি ${h1 || "স্মৃতিসেতু"} পেজে আছেন। সারাংশ: `,
      mni: `নত্ত্রা ${h1 || "স্মৃতিসেতু"} পেজদা লৈরি। `,
      brx: `নং ${h1 || "স্মৃতিসেতু"} পেজাও দং। `,
      ne: `तपाईं ${h1 || "स्मृतिसेतु"} मा हुनुहुन्छ। विवरण: `,
    }[lang];

    const fullReadout = `${summaryPrefix} ${mainText || "Ready for your commands."}`;
    setTranscript(fullReadout);
    setVoiceState("speaking");
    speak(fullReadout, language, () => setVoiceState("idle"));
  }, [language, speak, stopAudio]);

  const cancel = useCallback(() => {
    stopAudio();
    speech.cancelRecording();
    setVoiceState("idle");
    setErrorMessage(null);
    isProcessingRef.current = false;
  }, [speech, stopAudio]);

  return {
    isOpen,
    setIsOpen,
    voiceState,
    statusText: currentStatusText,
    transcript,
    lastInterpretation,
    lastResult,
    language,
    setLanguage,
    isSpeaking,
    permissionDenied: speech.permissionDenied,
    startListening,
    stopListening,
    toggleListening,
    submitTypedCommand,
    readScreen,
    cancel,
    stopAudio,
  };
}
