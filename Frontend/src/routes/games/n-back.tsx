import { createFileRoute } from "@tanstack/react-router";
import NBack from "@/features/games/games/NBack";

export const Route = createFileRoute("/games/n-back")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "N-Back | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: NBackPage,
});

function NBackPage() {
  const { level } = Route.useSearch();
  return <NBack level={level} />;
}
