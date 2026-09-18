import { createFileRoute } from "@tanstack/react-router";
import ReactionTime from "@/features/games/games/ReactionTime";

export const Route = createFileRoute("/games/reaction-time")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Reaction Time | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: ReactionTimePage,
});

function ReactionTimePage() {
  const { level } = Route.useSearch();
  return <ReactionTime level={level} />;
}
