import { createFileRoute } from "@tanstack/react-router";
import QuickMath from "@/features/games/games/QuickMath";

export const Route = createFileRoute("/games/quick-math")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Quick Math | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: QuickMathPage,
});

function QuickMathPage() {
  const { level } = Route.useSearch();
  return <QuickMath level={level} />;
}
