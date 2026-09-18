import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/games")({
  component: GamesLayout,
});

function GamesLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
