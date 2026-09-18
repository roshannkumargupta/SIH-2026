import { createFileRoute } from "@tanstack/react-router";
import SimonSays from "@/features/games/games/SimonSays";

export const Route = createFileRoute("/games/simon-says")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Simon Says | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: SimonSaysPage,
});

function SimonSaysPage() {
  const { level } = Route.useSearch();
  return <SimonSays level={level} />;
}
