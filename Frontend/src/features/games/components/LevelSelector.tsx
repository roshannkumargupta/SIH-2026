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
    <div className="flex items-center gap-3 rounded-2xl border border-clay bg-surface px-5 py-3 shadow-card">
      <span className="text-sm font-bold text-cream/70 uppercase tracking-wide">Level</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLevel(level - 1)}
          disabled={level <= 1}
          className="flex size-9 items-center justify-center rounded-lg border border-clay bg-ink text-cream hover:bg-clay disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-lg"
          aria-label="Previous level"
        >
          −
        </button>
        <span className="font-display text-2xl font-bold text-sun w-10 text-center">{level}</span>
        <button
          type="button"
          onClick={() => setLevel(level + 1)}
          disabled={level >= maxLevel}
          className="flex size-9 items-center justify-center rounded-lg border border-clay bg-ink text-cream hover:bg-clay disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-lg"
          aria-label="Next level"
        >
          +
        </button>
      </div>
      <span className="text-xs text-cream/50 ml-1">of {maxLevel}</span>
    </div>
  );
}
