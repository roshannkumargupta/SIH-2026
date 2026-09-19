import React, { useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  House,
  Bell,
  Check,
  LogOut,
  Brain,
  Pill,
  CalendarDays,
  Heart,
  BarChart3,
  Stethoscope,
  Users,
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
import defaultProfilePhoto from "@/assets/default-avatar.svg";

interface NavigationHeaderProps {
  progress?: number | undefined;
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
        ...(editPhone.trim() ? { phone: editPhone.trim() } : {}),
        ...(editAvatarBase64 ? { avatar_url: editAvatarBase64 } : {}),
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
    <header className="border-b border-white/5 bg-[#0A1420] text-[#E8ECEF] sticky top-0 z-30">
      <nav
        className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-8"
        aria-label="Main navigation"
      >
        {/* Left: Brand Logo (visible on mobile / tablet or top of page) */}
        <div className="flex items-center gap-4 lg:hidden">
          <AppLogo size="sm" />
        </div>

        {/* Desktop subtle companion pill */}
        <div className="hidden lg:flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 text-xs font-semibold text-[#8A99A8]">
            <Sparkles size={13} className="text-[#6FAF9A]" />
            <span>Cognitive Care Companion</span>
          </span>
        </div>

        {/* Right side: Progress, Language, Notification bell, User info */}
        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
          {progress !== undefined && user?.role === "patient" && (
            <div className="hidden sm:block w-32 md:w-36 bg-[#121D2B] border border-white/8 rounded-full px-3 py-1.5 shadow-sm">
              <div className="mb-1 flex justify-between text-[11px] font-bold text-[#E8ECEF]">
                <span className="text-[#8A99A8]">{t("nav.today")}</span>
                <span className="text-[#6FAF9A] font-extrabold">{progress}%</span>
              </div>
              <Progress
                value={progress}
                aria-label={`${progress}% complete`}
                className="h-1.5 bg-white/10 rounded-full [&>div]:bg-[#6FAF9A]"
              />
            </div>
          )}

          {/* Global Dynamic Language Switcher */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-[#121D2B] px-3 py-1.5 text-xs text-[#E8ECEF] hover:border-[#6FAF9A]/40 transition shadow-sm">
            <Globe size={14} className="text-[#6FAF9A] shrink-0" aria-hidden="true" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as VoiceLanguageCode)}
              className="bg-transparent font-medium text-[#E8ECEF] focus:outline-none cursor-pointer text-xs"
              aria-label={t("nav.selectLanguage")}
            >
              {supportedLanguages.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#121D2B] text-[#E8ECEF]">
                  {l.nativeName === l.name ? l.name : `${l.nativeName} (${l.name})`}
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
                className="relative flex size-9 sm:size-10 items-center justify-center rounded-full border border-white/8 bg-[#121D2B] text-[#E8ECEF] hover:border-[#6FAF9A]/40 transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6FAF9A]"
                aria-label={t("nav.notifications")}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-[#E85D6B] text-[10px] font-extrabold text-white shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#121D2B] backdrop-blur-xl p-4 shadow-2xl z-50 text-[#E8ECEF] animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-white/8">
                    <h3 className="font-display font-bold text-base text-[#E8ECEF]">{t("nav.notifications")}</h3>
                    <span className="text-xs text-[#6FAF9A] font-bold px-2 py-0.5 rounded-full bg-[#6FAF9A]/10">
                      {notifications.length} alerts
                    </span>
                  </div>
                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="py-5 text-center text-sm text-[#8A99A8] font-medium">
                        {t("nav.noNotifications")}
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-sm transition flex items-start justify-between gap-3 ${
                            n.status === "read"
                              ? "border-white/5 bg-white/5 text-[#8A99A8]"
                              : "border-[#6FAF9A]/20 bg-[#6FAF9A]/5 text-[#E8ECEF] shadow-sm"
                          }`}
                        >
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-[#E8ECEF]">{n.title}</p>
                            <p className="mt-0.5 text-xs text-[#8A99A8] leading-relaxed">{n.message}</p>
                          </div>
                          {n.status !== "read" && (
                            <button
                              type="button"
                              onClick={() => markAsRead(n.id)}
                              className="size-7 shrink-0 flex items-center justify-center rounded-lg bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] transition shadow-sm"
                              title={t("nav.markRead")}
                            >
                              <Check size={14} strokeWidth={2.5} />
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
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="flex items-center gap-2 rounded-full p-1 pl-1.5 pr-3 bg-[#121D2B] border border-white/8 hover:border-[#6FAF9A]/40 transition text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6FAF9A]"
                title={t("nav.editProfile")}
              >
                <img
                  src={user.avatar_url || defaultProfilePhoto}
                  alt={user.name}
                  className="size-7 rounded-full border border-[#6FAF9A]/40 object-cover shadow-sm"
                />
                <span className="hidden sm:inline text-xs font-semibold text-[#E8ECEF]">{user.name}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex size-9 sm:size-10 items-center justify-center rounded-full border border-white/8 bg-[#121D2B] text-[#8A99A8] hover:text-[#E85D6B] hover:border-[#E85D6B]/40 transition shadow-sm"
                title={t("nav.logout")}
                aria-label={t("nav.logout")}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold text-[#6FAF9A] hover:underline px-3 py-1.5 rounded-full bg-white/5 border border-white/8"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      </nav>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="bg-[#121D2B] border border-white/10 text-[#E8ECEF] max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-[#E8ECEF]">
              Edit Your Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 mt-4">
            <div className="flex flex-col items-center gap-3">
              <img
                src={editAvatarBase64 || defaultProfilePhoto}
                alt="Profile Preview"
                className="size-24 rounded-full border-2 border-[#6FAF9A]/60 object-cover shadow-md"
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
                className="rounded-full text-xs font-semibold bg-[#0A1420] border-white/10 text-[#E8ECEF] hover:bg-white/5"
              >
                <ImageIcon size={14} className="mr-1.5" /> Change Avatar Photo
              </Button>
            </div>

            <div>
              <Label htmlFor="prof-name" className="text-xs font-bold text-[#E8ECEF]">
                Full Name
              </Label>
              <Input
                id="prof-name"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your full name"
                className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] mt-1 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="prof-phone" className="text-xs font-bold text-[#E8ECEF]">
                Phone Number
              </Label>
              <Input
                id="prof-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] mt-1 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="prof-lang" className="text-xs font-bold text-[#E8ECEF]">
                Preferred Language
              </Label>
              <select
                id="prof-lang"
                value={editLanguage}
                onChange={(e) => setEditLanguage(e.target.value as VoiceLanguageCode)}
                className="w-full bg-[#0A1420] border border-white/10 text-[#E8ECEF] mt-1 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#6FAF9A]"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#121D2B] text-[#E8ECEF]">
                    {l.nativeName === l.name ? l.name : `${l.nativeName} (${l.name})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditProfileOpen(false)}
                className="rounded-full text-[#8A99A8] hover:text-[#E8ECEF]"
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={isSavingProfile} className="rounded-full bg-[#6FAF9A] text-[#0A1420] font-bold hover:bg-[#5E9E8A]">
                {isSavingProfile ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
