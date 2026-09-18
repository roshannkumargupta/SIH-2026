import { createFileRoute } from "@tanstack/react-router";
import WorkingMemoryGrid from "@/features/games/games/WorkingMemoryGrid";

export const Route = createFileRoute("/games/working-memory-grid")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Working Memory Grid | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: WorkingMemoryGridPage,
});

function WorkingMemoryGridPage() {
  const { level } = Route.useSearch();
  return <WorkingMemoryGrid level={level} />;
}
