import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Waves,
  Music,
  CloudRain,
  Bell,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { SOUNDSCAPES, type SoundscapeTrack } from "../data/soundscapes";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function SoundscapePlayer() {
  const { t } = useLanguage();
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeTrack, setActiveTrack] = useState<SoundscapeTrack>(SOUNDSCAPES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [unavailableTracks, setUnavailableTracks] = useState<Record<string, boolean>>({});

  // Stop playback on route change or unmount
  useEffect(() => {
    const audioEl = audioRef.current;
    return () => {
      if (audioEl) {
        audioEl.pause();
        audioEl.src = "";
      }
      setIsPlaying(false);
    };
  }, [location.pathname]);

  // Handle volume updates
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Switch track handler
  const handleSelectTrack = (track: SoundscapeTrack) => {
    if (track.id === activeTrack.id) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setActiveTrack(track);
    setIsPlaying(false);
  };

  const handleTogglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (unavailableTracks[activeTrack.id]) return;

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        // Track failed to play (e.g. 404 or unsupported audio)
        setUnavailableTracks((prev) => ({ ...prev, [activeTrack.id]: true }));
        setIsPlaying(false);
      }
    }
  };

  const handleAudioError = () => {
    setUnavailableTracks((prev) => ({ ...prev, [activeTrack.id]: true }));
    setIsPlaying(false);
  };

  const handleVolumeChange = (vals: number[]) => {
    const val = vals[0] ?? 0.6;
    setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const getTrackIcon = (theme: SoundscapeTrack["theme"]) => {
    switch (theme) {
      case "river":
        return <Waves className="w-6 h-6 text-teal-600 dark:text-teal-400" />;
      case "flute":
        return <Music className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      case "rain":
        return <CloudRain className="w-6 h-6 text-sky-600 dark:text-sky-400" />;
      case "bells":
        return <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const isCurrentUnavailable = !!unavailableTracks[activeTrack.id];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={activeTrack.src}
        loop={activeTrack.loop}
        onError={handleAudioError}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Main Active Soundscape Showcase Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-500/20 border border-teal-200/50 dark:border-teal-800/40 p-8 shadow-sm backdrop-blur-md">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center border border-teal-100 dark:border-teal-900">
            {getTrackIcon(activeTrack.theme)}
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("dashboard:soundscapeCalmEnv")}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t(activeTrack.titleKey)}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {t(activeTrack.descriptionKey)}
            </p>
          </div>

          {/* Fallback notification if audio asset is missing */}
          {isCurrentUnavailable && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>{t("dashboard:soundscapeComingSoonDesc")}</span>
            </div>
          )}

          {/* Primary Controls */}
          <div className="flex items-center gap-6 pt-2">
            <Button
              type="button"
              onClick={handleTogglePlay}
              disabled={isCurrentUnavailable}
              size="lg"
              className={`h-16 w-16 rounded-full shadow-lg transition-transform active:scale-95 ${
                isPlaying
                  ? "bg-teal-700 hover:bg-teal-800 text-white"
                  : "bg-teal-600 hover:bg-teal-700 text-white"
              }`}
              aria-label={
                isPlaying ? t("dashboard:soundscapePause") : t("dashboard:soundscapePlay")
              }
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-3 w-full max-w-xs pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Track Picker Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("dashboard:soundscapeSelectAtmosphere")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SOUNDSCAPES.map((track) => {
            const isSelected = track.id === activeTrack.id;
            const isUnavailable = !!unavailableTracks[track.id];

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handleSelectTrack(track)}
                className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-white dark:bg-slate-800 border-teal-500 shadow-md ring-2 ring-teal-500/20"
                    : "bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300"
                }`}
              >
                <div
                  className={`p-3 rounded-xl ${
                    isSelected ? "bg-teal-50 dark:bg-teal-950/60" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {getTrackIcon(track.theme)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {t(track.titleKey)}
                    </h4>
                    {isUnavailable ? (
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {t("dashboard:soundscapeComingSoon")}
                      </span>
                    ) : isSelected && isPlaying ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {t(track.descriptionKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
