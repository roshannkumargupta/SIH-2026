import { createFileRoute } from "@tanstack/react-router";
import Maze from "@/features/games/games/Maze";

export const Route = createFileRoute("/games/maze")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Pathway Maze | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: MazePage,
});

function MazePage() {
  const { level } = Route.useSearch();
  return <Maze level={level} />;
}
