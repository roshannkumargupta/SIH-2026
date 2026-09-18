import { createFileRoute } from "@tanstack/react-router";
import DualTask from "@/features/games/games/DualTask";

export const Route = createFileRoute("/games/dual-task")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Dual Task | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: DualTaskPage,
});

function DualTaskPage() {
  const { level } = Route.useSearch();
  return <DualTask level={level} />;
}
