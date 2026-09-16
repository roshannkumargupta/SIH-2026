import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import DelayedRecall from "@/features/games/games/DelayedRecall";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/delayed-recall")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Delayed Recall | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: DelayedRecallPage,
});

function DelayedRecallPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("delayed-recall")!;
  return (
    <GameShell game={game} level={level}>
      <DelayedRecall level={level} />
    </GameShell>
  );
}
