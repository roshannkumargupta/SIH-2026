import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import SchulteTable from "@/features/games/games/SchulteTable";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/schulte-table")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Schulte Table | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: SchulteTablePage,
});

function SchulteTablePage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("schulte-table")!;
  return (
    <GameShell game={game} level={level}>
      <SchulteTable level={level} />
    </GameShell>
  );
}
