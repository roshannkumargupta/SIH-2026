import { useNavigate, useSearch } from "@tanstack/react-router";

interface LevelSelectorProps {
  gameId: string;
  maxLevel?: number;
}

/**
 * Reads the current level from ?level=N URL search param,
 * and provides +/- controls to navigate between levels.
 * Uses TanStack Router's useSearch / useNavigate — no react-router-dom.
 */
export function LevelSelector({ gameId, maxLevel = 10 }: LevelSelectorProps) {
  const navigate = useNavigate();
  // Read level from search params (with safe fallback)
  let level = 1;
  try {
    const search = useSearch({ strict: false }) as Record<string, unknown>;
    const raw = Number(search?.["level"] ?? "1");
    level = Math.min(Math.max(1, isNaN(raw) ? 1 : raw), maxLevel);
  } catch {
    level = 1;
  }

  const setLevel = (next: number) => {
    void navigate({
      to: `/games/${gameId}` as never,
      // Cast to bypass strict param types — level is validated by validateSearch
      search: { level: String(Math.min(Math.max(1, next), maxLevel)) } as never,
      replace: true,
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#121D2B] px-4 py-2 shadow-sm">
      <span className="text-xs font-bold text-[#8A99A8] uppercase tracking-wide">Level</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLevel(level - 1)}
          disabled={level <= 1}
          className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-[#0A1420] text-[#E8ECEF] hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-base shadow-xs"
          aria-label="Previous level"
        >
          −
        </button>
        <span className="font-display text-xl font-bold text-[#6FAF9A] w-8 text-center">{level}</span>
        <button
          type="button"
          onClick={() => setLevel(level + 1)}
          disabled={level >= maxLevel}
          className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-[#0A1420] text-[#E8ECEF] hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-base shadow-xs"
          aria-label="Next level"
        >
          +
        </button>
      </div>
      <span className="text-xs text-[#8A99A8]">of {maxLevel}</span>
    </div>
  );
}
