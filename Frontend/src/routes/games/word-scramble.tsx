import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/features/games/components/GameShell";
import WordScramble from "@/features/games/games/WordScramble";
import { GAME_MAP } from "@/features/games/data/gameRegistry";

export const Route = createFileRoute("/games/word-scramble")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Word Scramble | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: WordScramblePage,
});

function WordScramblePage() {
  const { level } = Route.useSearch();
  const game = GAME_MAP.get("word-scramble")!;
  return (
    <GameShell game={game} level={level}>
      <WordScramble level={level} />
    </GameShell>
  );
}
