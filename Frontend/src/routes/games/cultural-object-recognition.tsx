import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import CulturalObjectRecognition from "@/features/games/games/CulturalObjectRecognition";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/cultural-object-recognition")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Cultural Object Recognition | SmritiSetu" },
      { name: "description", content: "Cultural heritage cognitive game on SmritiSetu." },
    ],
  }),
  component: CulturalObjectRecognitionPage,
});

function CulturalObjectRecognitionPage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("cultural-object-recognition")!;
  return (
    <GameShell game={game} level={level}>
      <CulturalObjectRecognition level={level} />
    </GameShell>
  );
}
