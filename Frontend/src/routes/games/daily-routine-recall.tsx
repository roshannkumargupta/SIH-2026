import { createFileRoute } from "@tanstack/react-router";
import DailyRoutineRecall from "@/features/games/games/DailyRoutineRecall";

export const Route = createFileRoute("/games/daily-routine-recall")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Daily Routine Recall | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: DailyRoutineRecallPage,
});

function DailyRoutineRecallPage() {
  const { level } = Route.useSearch();
  return <DailyRoutineRecall level={level} />;
}
