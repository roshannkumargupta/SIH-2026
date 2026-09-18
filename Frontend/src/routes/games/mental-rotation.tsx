import { createFileRoute } from "@tanstack/react-router";
import MentalRotation from "@/features/games/games/MentalRotation";

export const Route = createFileRoute("/games/mental-rotation")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Mental Rotation | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: MentalRotationPage,
});

function MentalRotationPage() {
  const { level } = Route.useSearch();
  return <MentalRotation level={level} />;
}
