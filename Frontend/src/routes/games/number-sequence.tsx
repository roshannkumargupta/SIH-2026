import { createFileRoute } from "@tanstack/react-router";
import NumberSequence from "@/features/games/games/NumberSequence";

export const Route = createFileRoute("/games/number-sequence")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Number Sequence | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: NumberSequencePage,
});

function NumberSequencePage() {
  const { level } = Route.useSearch();
  return <NumberSequence level={level} />;
}
