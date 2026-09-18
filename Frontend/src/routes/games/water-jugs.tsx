import { createFileRoute } from "@tanstack/react-router";
import WaterJugs from "@/features/games/games/WaterJugs";

export const Route = createFileRoute("/games/water-jugs")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Water Jugs | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: WaterJugsPage,
});

function WaterJugsPage() {
  const { level } = Route.useSearch();
  return <WaterJugs level={level} />;
}
