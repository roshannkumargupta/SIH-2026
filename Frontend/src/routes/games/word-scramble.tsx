import { createFileRoute } from "@tanstack/react-router";
import WordScramble from "@/features/games/games/WordScramble";

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
  return <WordScramble level={level} />;
}
