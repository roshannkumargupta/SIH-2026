import { createFileRoute } from "@tanstack/react-router";
import TrailMaking from "@/features/games/games/TrailMaking";

export const Route = createFileRoute("/games/trail-making")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Trail Making | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: TrailMakingPage,
});

function TrailMakingPage() {
  const { level } = Route.useSearch();
  return <TrailMaking level={level} />;
}
