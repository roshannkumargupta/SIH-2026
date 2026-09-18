import { createFileRoute } from "@tanstack/react-router";
import SchulteTable from "@/features/games/games/SchulteTable";

export const Route = createFileRoute("/games/schulte-table")({
  validateSearch: (search: Record<string, unknown>) => ({
    level: Math.min(Math.max(1, parseInt(String(search["level"] ?? "1"), 10) || 1), 10),
  }),
  head: () => ({
    meta: [
      { title: "Schulte Table | SmritiSetu" },
      { name: "description", content: "Cognitive training game on SmritiSetu." },
    ],
  }),
  component: SchulteTablePage,
});

function SchulteTablePage() {
  const { level } = Route.useSearch();
  return <SchulteTable level={level} />;
}
