import { createFileRoute } from "@tanstack/react-router";
import CulturalObjectRecognition from "@/features/games/games/CulturalObjectRecognition";

export const Route = createFileRoute("/games/cultural-object-recognition")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Cultural Object Recognition | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: CulturalObjectRecognitionPage,
});

function CulturalObjectRecognitionPage() {
  const { level } = Route.useSearch();
  return <CulturalObjectRecognition level={level} />;
}
