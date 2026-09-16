import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import NBack from "@/features/games/games/NBack";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/n-back")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "N Back | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: NBackPage,
});

function NBackPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("n-back")!;
  return (
    <GameShell game={game} level={level}>
      <NBack level={level} />
    </GameShell>
  );
}
