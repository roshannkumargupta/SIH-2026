import { createFileRoute } from "@tanstack/react-router";
import DelayedRecall from "@/features/games/games/DelayedRecall";

export const Route = createFileRoute("/games/delayed-recall")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Delayed Recall | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: DelayedRecallPage,
});

function DelayedRecallPage() {
  const { level } = Route.useSearch();
  return <DelayedRecall level={level} />;
}
