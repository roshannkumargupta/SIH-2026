import React, { useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  House,
  Bell,
  Check,
  User as UserIcon,
  LogOut,
  Brain,
  Pill,
  CalendarDays,
  Heart,
  BarChart3,
  Stethoscope,
  Users,
  Settings,
  Image as ImageIcon,
  Globe,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useLanguage } from "../context/LanguageContext";
import type { VoiceLanguageCode } from "@/features/voice/types/voice.types";
import { useNotifications } from "../hooks/use-notifications";
import { AppLogo } from "./AppLogo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { authApi } from "../api/auth.api";
import { formatApiError } from "../api/client";
import { toast } from "sonner";
import defaultProfilePhoto from "@/assets/profile-lalita.jpg";

interface NavigationHeaderProps {
  progress?: number;
}

export function NavigationHeader({ progress }: NavigationHeaderProps) {
  const { user, isAuthenticated, logout, refetchMe } = useAuth();
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatarBase64, setEditAvatarBase64] = useState<string>("");
  const [editLanguage, setEditLanguage] = useState<VoiceLanguageCode>(language);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleOpenEditProfile = () => {
    if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phone || "");
      setEditAvatarBase64(user.avatar_url || "");
      setEditLanguage(language);
    }
    setIsEditProfileOpen(true);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setEditAvatarBase64(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSavingProfile(true);
    try {
      await setLanguage(editLanguage);
      await authApi.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        avatar_url: editAvatarBase64 || undefined,
        preferred_language: editLanguage,
      });
      if (refetchMe) await refetchMe();
      toast.success("Profile updated successfully!");
      setIsEditProfileOpen(false);
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update profile"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="border-b border-clay bg-surface text-cream sticky top-0 z-40 shadow-md">
      <nav
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-8"
        aria-label="Main navigation"
      >
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <AppLogo size="md" />
        </div>

        {/* Center: Navigation Links strictly isolated by Role */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1.5 text-sm font-bold">
            {user?.role === "patient" && (
              <>
                <Link
                  to="/"
                  className="rounded-xl px-3.5 py-2 transition text-cream hover:text-sun hover:bg-clay/50 min-h-[40px] flex items-center gap-1.5"
                  activeProps={{ className: "text-sun bg-clay shadow-inner" }}
                >
                  <House size={18} aria-hidden="true" />
                  <span>{t("nav.home")}</span>
                </Link>
                <Link
                  to="/games"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 transition text-cream hover:text-sun hover:bg-clay/50 min-h-[40px]"
                  activeProps={{ className: "text-sun bg-clay shadow-inner" }}
                >
                  <Brain size={18} aria-hidden="true" />
                  <span>{t("nav.games")}</span>
                </Link>
                <Link
                  to="/medication"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 transition text-cream hover:text-sun hover:bg-clay/50 min-h-[40px]"
                  activeProps={{ className: "text-sun bg-clay shadow-inner" }}
                >
                  <Pill size={18} aria-hidden="true" />
                  <span>{t("nav.medicine")}</span>
                </Link>
                <Link
                  to="/routine"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 transition text-cream hover:text-sun hover:bg-clay/50 min-h-[40px]"
                  activeProps={{ className: "text-sun bg-clay shadow-inner" }}
                >
                  <CalendarDays size={18} aria-hidden="true" />
                  <span>{t("nav.routine")}</span>
                </Link>
                <Link
                  to="/memories"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 transition text-cream hover:text-sun hover:bg-clay/50 min-h-[40px]"
                  activeProps={{ className: "text-sun bg-clay shadow-inner" }}
                >
                  <Heart size={18} aria-hidden="true" />
                  <span>{t("nav.memories")}</span>
                </Link>
                <Link
                  to="/calm"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 transition text-cream hover:text-sun hover:bg-clay/50 min-h-[40px]"
                  activeProps={{ className: "text-sun bg-clay shadow-inner" }}
                >
                  <Sparkles size={18} aria-hidden="true" />
                  <span>{t("nav.calm")}</span>
                </Link>
              </>
            )}

            {user?.role === "caretaker" && (
              <>
                <Link
                  to="/caregiver"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 bg-tea-confirm/30 text-cream hover:bg-tea-confirm transition border border-tea-confirm min-h-[40px]"
                >
                  <Users size={18} aria-hidden="true" />
                  <span>{t("nav.connectedPatients")}</span>
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 transition text-cream hover:text-sun hover:bg-clay/50 min-h-[40px]"
                  activeProps={{ className: "text-sun bg-clay shadow-inner" }}
                >
                  <BarChart3 size={18} aria-hidden="true" />
                  <span>{t("nav.analytics")}</span>
                </Link>
              </>
            )}

            {user?.role === "doctor" && (
              <>
                <Link
                  to="/doctor"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 bg-tea-confirm/30 text-cream hover:bg-tea-confirm transition border border-tea-confirm min-h-[40px]"
                >
                  <Stethoscope size={18} aria-hidden="true" />
                  <span>{t("nav.doctorPortal")}</span>
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2 transition text-cream hover:text-sun hover:bg-clay/50 min-h-[40px]"
                  activeProps={{ className: "text-sun bg-clay shadow-inner" }}
                >
                  <BarChart3 size={18} aria-hidden="true" />
                  <span>{t("nav.progression")}</span>
                </Link>
              </>
            )}
          </div>
        )}

        {/* Right side: Progress, Notification bell, User info */}
        <div className="flex items-center gap-3 sm:gap-4">
          {progress !== undefined && user?.role === "patient" && (
            <div className="hidden sm:block w-36 md:w-44">
              <div className="mb-1 flex justify-between text-xs font-bold text-cream">
                <span>{t("nav.today")}</span>
                <span className="text-sun font-extrabold">{progress}%</span>
              </div>
              <Progress
                value={progress}
                aria-label={`${progress}% complete`}
                className="h-2.5 bg-clay rounded-full [&>div]:bg-sun"
              />
            </div>
          )}

          {/* Global Dynamic Language Switcher */}
          <div className="flex items-center gap-1.5 rounded-xl border border-clay bg-ink/90 px-3 py-2 text-xs text-cream hover:border-sun transition shadow-inner">
            <Globe size={16} className="text-sun shrink-0" aria-hidden="true" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as VoiceLanguageCode)}
              className="bg-transparent font-bold text-cream focus:outline-none cursor-pointer text-xs"
              aria-label={t("nav.selectLanguage")}
            >
              {supportedLanguages.map((l) => (
                <option key={l.code} value={l.code} className="bg-surface text-cream">
                  {l.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications button */}
          {isAuthenticated && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((v) => !v)}
                className="relative flex size-11 items-center justify-center rounded-xl border border-clay bg-ink text-cream hover:border-sun transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sun"
                aria-label={t("nav.notifications")}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-fire text-[11px] font-extrabold text-cream shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-clay bg-surface p-4 shadow-card z-50 text-cream">
                  <div className="flex items-center justify-between pb-3 border-b border-clay">
                    <h3 className="font-display font-bold text-lg">{t("nav.notifications")}</h3>
                    <span className="text-xs text-sun font-semibold">
                      {notifications.length} alerts
                    </span>
                  </div>
                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="py-5 text-center text-sm text-cream/70 font-medium">
                        {t("nav.noNotifications")}
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 rounded-xl border text-sm transition flex items-start justify-between gap-3 ${
                            n.status === "read"
                              ? "border-clay/50 bg-ink/40 text-cream/70"
                              : "border-sun/60 bg-ink text-cream shadow-sm"
                          }`}
                        >
                          <div>
                            <p className="font-bold">{n.title}</p>
                            <p className="mt-1 text-xs opacity-90 leading-relaxed">{n.message}</p>
                          </div>
                          {n.status !== "read" && (
                            <button
                              type="button"
                              onClick={() => markAsRead(n.id)}
                              className="size-8 shrink-0 flex items-center justify-center rounded-lg bg-tea-confirm text-cream hover:bg-tea-confirm/80 transition"
                              title={t("nav.markRead")}
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile or Login */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-clay/50 transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sun"
                title={t("nav.editProfile")}
              >
                <img
                  src={user.avatar_url || defaultProfilePhoto}
                  alt={user.name}
                  className="size-10 rounded-full border-2 border-sun object-cover shadow-sm"
                />
                <span className="hidden lg:inline text-sm font-bold text-cream">{user.name}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex size-11 items-center justify-center rounded-xl border border-clay bg-ink text-cream hover:bg-fire/80 hover:border-fire transition"
                title={t("nav.logout")}
                aria-label={t("nav.logout")}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t("nav.signIn")}</Link>
              </Button>
              <Button asChild variant="cream" size="sm">
                <Link to="/register">{t("nav.register")}</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="bg-surface border-clay text-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-cream">
              Edit Your Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 mt-4">
            <div className="flex flex-col items-center gap-3">
              <img
                src={editAvatarBase64 || defaultProfilePhoto}
                alt="Profile Preview"
                className="size-24 rounded-full border-2 border-sun object-cover shadow-md"
              />
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                className="border-clay text-cream hover:bg-clay text-xs"
              >
                <ImageIcon size={14} className="mr-1.5" /> Change Avatar Photo
              </Button>
            </div>

            <div>
              <Label htmlFor="prof-name" className="text-sm font-bold text-cream">
                Full Name
              </Label>
              <Input
                id="prof-name"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your full name"
                className="bg-ink border-clay text-cream mt-1"
              />
            </div>

            <div>
              <Label htmlFor="prof-phone" className="text-sm font-bold text-cream">
                Phone Number
              </Label>
              <Input
                id="prof-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-ink border-clay text-cream mt-1"
              />
            </div>

            <div>
              <Label htmlFor="prof-lang" className="text-sm font-bold text-cream">
                Preferred Language
              </Label>
              <select
                id="prof-lang"
                value={editLanguage}
                onChange={(e) => setEditLanguage(e.target.value as VoiceLanguageCode)}
                className="w-full bg-ink border border-clay text-cream mt-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sun"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-surface text-cream">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditProfileOpen(false)}
                className="border border-clay text-cream"
              >
                Cancel
              </Button>
              <Button type="submit" variant="cream" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
