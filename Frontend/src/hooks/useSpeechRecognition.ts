import { useState, useRef, useCallback } from "react";

interface UseSpeechRecognitionOptions {
  onAudioReady: (audioBlob: Blob) => void;
  onError?: (error: Error) => void;
  maxDurationMs?: number;
  silenceThresholdMs?: number;
}

export function useSpeechRecognition({
  onAudioReady,
  onError,
  maxDurationMs = 7000,
  silenceThresholdMs = 700,
}: UseSpeechRecognitionOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const cleanup = useCallback(() => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("Error stopping MediaRecorder:", err);
      }
    }
  }, []);

  const cancelRecording = useCallback(() => {
    audioChunksRef.current = [];
    cleanup();
  }, [cleanup]);

  const startSilenceDetection = useCallback(
    (stream: MediaStream) => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const samples = new Uint8Array(analyser.fftSize);
        let heardSpeech = false;
        let lastSoundTime = Date.now();

        silenceTimerRef.current = setInterval(() => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
            return;
          }

          analyser.getByteTimeDomainData(samples);
          let energy = 0;
          for (let i = 0; i < samples.length; i++) {
            energy += Math.abs(samples[i] - 128);
          }
          const average = energy / samples.length;

          if (average > 3.5) {
            heardSpeech = true;
            lastSoundTime = Date.now();
          }

          // If speech was heard and silence follows for configured threshold, stop recording automatically
          if (heardSpeech && Date.now() - lastSoundTime > silenceThresholdMs) {
            stopRecording();
          }
        }, 80);
      } catch (err) {
        console.warn(
          "Silence detection could not be initialized, relying on max duration timer:",
          err,
        );
      }
    },
    [silenceThresholdMs, stopRecording],
  );

  const startRecording = useCallback(async () => {
    setError(null);
    setPermissionDenied(false);

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      const msg =
        "Voice recording is not supported in this browser. Please use Chrome, Edge, or Firefox.";
      setError(msg);
      onError?.(new Error(msg));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 },
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        cleanup();
        if (audioBlob.size > 0) {
          onAudioReady(audioBlob);
        }
      };

      recorder.start();
      setIsRecording(true);

      startSilenceDetection(stream);

      // Hard upper limit timer to prevent endless listening
      maxTimerRef.current = setTimeout(() => {
        stopRecording();
      }, maxDurationMs);
    } catch (err: unknown) {
      cleanup();
      const isDenied =
        (err as Error)?.name === "NotAllowedError" ||
        (err as Error)?.name === "PermissionDeniedError";
      setPermissionDenied(isDenied);
      const msg = isDenied
        ? "Microphone access was denied. Please allow microphone permissions in your browser bar."
        : "Could not start microphone. Please check your audio device.";
      setError(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
    }
  }, [cleanup, maxDurationMs, onAudioReady, onError, startSilenceDetection, stopRecording]);

  return {
    isRecording,
    permissionDenied,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
