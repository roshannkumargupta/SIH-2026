import { useCallback, useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
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
          accuracy: 100,
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

  if (won)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.max(10, Math.min(100, Math.round(1000 / Math.max(1, moves))))}
          accuracy={100}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
          gameName="Pathway Maze"
          synced={synced}
          offline={offline}
          onPlayAgain={reset}
        />
      </>
    );

  const cellSize = Math.min(28, Math.floor(350 / size));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 text-sm font-bold text-cream/70">
        <span>
          Moves: <span className="text-sun">{moves}</span>
        </span>
        <span className="text-cream/40">Reach the 🔴 goal</span>
      </div>

      <div className="border-2 border-clay rounded-xl overflow-hidden shadow-card">
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
                  className={`${cell === 1 ? "bg-clay/80" : isPlayer ? "bg-sun" : isGoal ? "bg-fire" : isStart ? "bg-tea-confirm/40" : "bg-ink/30"} flex items-center justify-center`}
                >
                  {isPlayer && <span style={{ fontSize: cellSize * 0.6 }}>•</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Arrow controls for mobile */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        <div />
        <button
          onClick={() => move(-1, 0)}
          className="px-4 py-2 rounded-lg bg-clay/60 text-cream font-bold hover:bg-clay transition"
          aria-label="Up"
        >
          ↑
        </button>
        <div />
        <button
          onClick={() => move(0, -1)}
          className="px-4 py-2 rounded-lg bg-clay/60 text-cream font-bold hover:bg-clay transition"
          aria-label="Left"
        >
          ←
        </button>
        <button
          onClick={() => move(1, 0)}
          className="px-4 py-2 rounded-lg bg-clay/60 text-cream font-bold hover:bg-clay transition"
          aria-label="Down"
        >
          ↓
        </button>
        <button
          onClick={() => move(0, 1)}
          className="px-4 py-2 rounded-lg bg-clay/60 text-cream font-bold hover:bg-clay transition"
          aria-label="Right"
        >
          →
        </button>
      </div>

      <button onClick={reset} className="text-xs text-cream/40 underline">
        New Maze
      </button>
    </div>
  );
}
