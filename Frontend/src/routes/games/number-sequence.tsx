import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import NumberSequence from "@/features/games/games/NumberSequence";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/number-sequence")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Number Sequence | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: NumberSequencePage,
});

function NumberSequencePage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("number-sequence")!;
  return (
    <GameShell game={game} level={level}>
      <NumberSequence level={level} />
    </GameShell>
  );
}
