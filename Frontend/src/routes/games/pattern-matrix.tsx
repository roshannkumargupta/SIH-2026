import { createFileRoute } from "@tanstack/react-router";
import PatternMatrix from "@/features/games/games/PatternMatrix";

export const Route = createFileRoute("/games/pattern-matrix")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Pattern Matrix | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: PatternMatrixPage,
});

function PatternMatrixPage() {
  const { level } = Route.useSearch();
  return <PatternMatrix level={level} />;
}
