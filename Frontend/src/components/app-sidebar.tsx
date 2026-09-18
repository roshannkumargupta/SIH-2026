import { Link, useLocation } from "@tanstack/react-router";
import {
  House,
  Brain,
  Pill,
  CalendarDays,
  Heart,
  Sparkles,
  Users,
  BarChart3,
  Stethoscope,
  LogOut,
} from "lucide-react";
import { AppLogo } from "./AppLogo";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { useTasks } from "@/hooks/use-tasks";
import { useMedications } from "@/hooks/use-medications";
import defaultProfilePhoto from "@/assets/default-avatar.svg";

export function AppSidebar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const currentPath = location.pathname;

  const { todayTasks } = useTasks();
  const { todayLogs } = useMedications();

  const pendingTasksCount = todayTasks.filter((t) => t.status !== "completed").length;
  const pendingMedsCount = todayLogs.filter((l) => l.status === "scheduled").length;

  const isPatient = !user || user.role === "patient";
  const isCaretaker = user?.role === "caretaker";
  const isDoctor = user?.role === "doctor";

  return (
    <aside
      className="hidden lg:flex flex-col justify-between w-60 shrink-0 min-h-screen bg-[#0A1420] border-r border-white/5 py-6 px-4 select-none sticky top-0 h-screen z-30"
      aria-label="Sidebar Navigation"
    >
      <div className="space-y-7">
        {/* Brand Logo */}
        <div className="px-2">
          <AppLogo size="md" />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Main menu">
          {isPatient && (
            <>
              {/* Home */}
              <Link
                to="/"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath === "/"
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <House size={20} className="shrink-0" />
                <span>{t("nav.home")}</span>
              </Link>

              {/* Games */}
              <Link
                to="/games"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath.startsWith("/games")
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <Brain size={20} className="shrink-0" />
                <span>{t("nav.games")}</span>
              </Link>

              {/* Medicine with notification count badge */}
              <Link
                to="/medication"
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath.startsWith("/medication")
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Pill size={20} className="shrink-0" />
                  <span>{t("nav.medicine")}</span>
                </div>
                {pendingMedsCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#E85D6B] text-white text-[11px] font-bold">
                    {pendingMedsCount}
                  </span>
                )}
              </Link>

              {/* Routine with notification count badge */}
              <Link
                to="/routine"
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath.startsWith("/routine")
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays size={20} className="shrink-0" />
                  <span>{t("nav.routine")}</span>
                </div>
                {pendingTasksCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#E85D6B] text-white text-[11px] font-bold">
                    {pendingTasksCount}
                  </span>
                )}
              </Link>

              {/* Memories */}
              <Link
                to="/memories"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath.startsWith("/memories")
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <Heart size={20} className="shrink-0" />
                <span>{t("nav.memories")}</span>
              </Link>

              {/* Calm & Relax */}
              <Link
                to="/calm"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath.startsWith("/calm")
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <Sparkles size={20} className="shrink-0" />
                <span>{t("nav.calm")}</span>
              </Link>
            </>
          )}

          {/* Caregiver Portal */}
          {isCaretaker && (
            <>
              <Link
                to="/caregiver"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath.startsWith("/caregiver")
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <Users size={20} className="shrink-0" />
                <span>{t("nav.connectedPatients")}</span>
              </Link>
              <Link
                to="/analytics"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath.startsWith("/analytics")
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <BarChart3 size={20} className="shrink-0" />
                <span>{t("nav.analytics")}</span>
              </Link>
            </>
          )}

          {/* Doctor Portal */}
          {isDoctor && (
            <>
              <Link
                to="/doctor"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath.startsWith("/doctor")
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <Stethoscope size={20} className="shrink-0" />
                <span>{t("nav.doctorPortal")}</span>
              </Link>
              <Link
                to="/analytics"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition text-sm ${
                  currentPath.startsWith("/analytics")
                    ? "bg-[#22C55E] text-[#0A1420] font-bold shadow-sm [&_svg]:text-[#0A1420]"
                    : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5 font-medium [&_svg]:text-[#8A99A8]"
                }`}
              >
                <BarChart3 size={20} className="shrink-0" />
                <span>{t("nav.progression")}</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* User profile / Logout at sidebar bottom */}
      {isAuthenticated && user && (
        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user.avatar_url || defaultProfilePhoto}
              alt={user.name}
              className="size-9 rounded-full border border-white/10 object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#E8ECEF] truncate">{user.name}</p>
              <p className="text-[11px] text-[#8A99A8] capitalize truncate">{user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-[#8A99A8] hover:text-rose-400 hover:bg-white/5 transition cursor-pointer"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
