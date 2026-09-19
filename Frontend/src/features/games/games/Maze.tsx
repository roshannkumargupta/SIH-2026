import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../components/GameShell";
import { useGameSession } from "../hooks/useGameSession";

const MAZE_SIZES: Record<number, number> = {
  1: 5,
  2: 7,
  3: 7,
  4: 9,
  5: 9,
  6: 11,
  7: 11,
  8: 13,
  9: 13,
  10: 15,
};

type Cell = 0 | 1; // 0 = open, 1 = wall

const generateMaze = (size: number): Cell[][] => {
  const grid: Cell[][] = Array.from({ length: size }, () => Array(size).fill(1) as Cell[]);
  const carve = (r: number, c: number) => {
    grid[r]![c] = 0;
    const dirs = [
      [0, 2],
      [0, -2],
      [2, 0],
      [-2, 0],
    ].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr!,
        nc = c + dc!;
      if (nr > 0 && nr < size - 1 && nc > 0 && nc < size - 1 && grid[nr]![nc] === 1) {
        grid[r + dr! / 2]![c + dc! / 2] = 0;
        carve(nr, nc);
      }
    }
  };
  carve(1, 1);
  grid[size - 2]![size - 2] = 0; // ensure goal accessible
  return grid;
};

export default function Maze({ level }: { level: number }) {
  const size = MAZE_SIZES[level] ?? 9;
  const [maze, setMaze] = useState<Cell[][]>(() => generateMaze(size));
  const [pos, setPos] = useState<[number, number]>([1, 1]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  const reset = useCallback(() => {
    const newMaze = generateMaze(size);
    setMaze(newMaze);
    setPos([1, 1]);
    setMoves(0);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [size]);

  useEffect(() => {
    reset();
  }, [level, reset]);

  const move = (dr: number, dc: number) => {
    if (won) return;
    const [r, c] = pos;
    const nr = r + dr,
      nc = c + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size || maze[nr]![nc] === 1) return;
    setPos([nr, nc]);
    setMoves((m) => m + 1);
    if (nr === size - 2 && nc === size - 2) {
      setWon(true);
      if (!saved.current) {
        saved.current = true;
        const score = Math.max(10, Math.min(100, Math.round(1000 / Math.max(1, moves + 1))));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "maze",
          gameType: "maze",
          score,
          accuracy: score,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
        });
      }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowUp") move(-1, 0);
      else if (e.key === "ArrowDown") move(1, 0);
      else if (e.key === "ArrowLeft") move(0, -1);
      else if (e.key === "ArrowRight") move(0, 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pos, won, maze, moves]);

  const finalScore = Math.max(10, Math.min(100, Math.round(1000 / Math.max(1, moves || 1))));
  const finalDuration = Math.round((Date.now() - sessionStart.current) / 1000);

  const cellSize = Math.min(28, Math.floor(350 / size));

  return (
    <GameShell
      gameId="maze"
      level={level}
      stats={[
        { label: "Moves", value: moves, highlight: "sun" },
        { label: "Grid Size", value: `${size}×${size}` },
      ]}
      instructionHint="Navigate the yellow dot to the red goal flag"
      completed={won}
      results={{
        score: finalScore,
        accuracy: finalScore,
        durationSeconds: finalDuration,
        synced,
        offline,
      }}
      onPlayAgain={reset}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="border-4 border-clay rounded-2xl overflow-hidden shadow-card bg-ink/70 p-1">
          {maze.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => {
                const isPlayer = pos[0] === r && pos[1] === c;
                const isGoal = r === size - 2 && c === size - 2;
                const isStart = r === 1 && c === 1;
                return (
                  <div
                    key={c}
                    style={{ width: cellSize, height: cellSize }}
                    className={`${
                      cell === 1
                        ? "bg-clay/80"
                        : isPlayer
                          ? "bg-sun shadow-sm"
                          : isGoal
                            ? "bg-fire animate-pulse"
                            : isStart
                              ? "bg-tea-confirm/40"
                              : "bg-ink/30"
                    } flex items-center justify-center transition-colors`}
                  >
                    {isPlayer && (
                      <span style={{ fontSize: cellSize * 0.6 }} className="text-ink">
                        ●
                      </span>
                    )}
                    {isGoal && !isPlayer && (
                      <span style={{ fontSize: cellSize * 0.6 }} className="text-cream">
                        🏁
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Arrow controls for mobile & desktop touch */}
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div />
          <button
            type="button"
            onClick={() => move(-1, 0)}
            className="min-w-[54px] min-h-[54px] rounded-2xl bg-clay text-cream font-black text-2xl hover:bg-clay/80 active:bg-sun active:text-ink active:scale-90 transition-all shadow-md touch-manipulation select-none flex items-center justify-center"
            aria-label="Up"
          >
            ↑
          </button>
          <div />
          <button
            type="button"
            onClick={() => move(0, -1)}
            className="min-w-[54px] min-h-[54px] rounded-2xl bg-clay text-cream font-black text-2xl hover:bg-clay/80 active:bg-sun active:text-ink active:scale-90 transition-all shadow-md touch-manipulation select-none flex items-center justify-center"
            aria-label="Left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => move(1, 0)}
            className="min-w-[54px] min-h-[54px] rounded-2xl bg-clay text-cream font-black text-2xl hover:bg-clay/80 active:bg-sun active:text-ink active:scale-90 transition-all shadow-md touch-manipulation select-none flex items-center justify-center"
            aria-label="Down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => move(0, 1)}
            className="min-w-[54px] min-h-[54px] rounded-2xl bg-clay text-cream font-black text-2xl hover:bg-clay/80 active:bg-sun active:text-ink active:scale-90 transition-all shadow-md touch-manipulation select-none flex items-center justify-center"
            aria-label="Right"
          >
            →
          </button>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={reset}
            className="text-sm font-semibold text-cream/70 hover:text-cream underline min-h-[48px] min-w-[48px] inline-flex items-center justify-center px-4 py-2 rounded-lg active:scale-95 transition touch-manipulation"
          >
            Generate New Maze
          </button>
        </div>
      </div>
    </GameShell>
  );
}
