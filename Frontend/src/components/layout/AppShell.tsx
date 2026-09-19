import type { ReactNode } from "react";
import { Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { NavigationHeader } from "@/components/navigation-header";
import { VoiceTriggerButton } from "@/features/voice/components/VoiceTriggerButton";

export interface AppShellProps {
  children?: ReactNode;
  progress?: number | undefined;
  className?: string;
}

export function AppShell({ children, progress, className = "" }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#0A1420] text-[#E8ECEF] flex selection:bg-[#6FAF9A]/20">
      {/* Persistent Left Sidebar Navigation */}
      <AppSidebar />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <NavigationHeader progress={progress} />
        <main className={`flex-1 ${className}`}>{children ?? <Outlet />}</main>
      </div>

      {/* Exactly ONE Voice Assistant Floating Trigger at the Shell Level */}
      <VoiceTriggerButton />
    </div>
  );
}
