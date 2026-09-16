import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import DailyRoutineRecall from "@/features/games/games/DailyRoutineRecall";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/daily-routine-recall")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Daily Routine Recall | SmritiSetu" },
      { name: "description", content: "Cognitive training sequencing game on SmritiSetu." },
    ],
  }),
  component: DailyRoutineRecallPage,
});

function DailyRoutineRecallPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("daily-routine-recall")!;
  return (
    <GameShell game={game} level={level}>
      <DailyRoutineRecall level={level} />
    </GameShell>
  );
}
