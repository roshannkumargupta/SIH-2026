import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { formatApiError } from "../api/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AppLogo } from "@/components/AppLogo";
import type { UserRole } from "../types/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register | SmritiSetu" },
      { name: "description", content: "Create an account on SmritiSetu." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Pre-validation
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName) {
      setErrorMessage("Please provide your full name.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please provide a valid email address (e.g. name@example.com).");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await register({
        name: cleanName,
        email: cleanEmail,
        password,
        role,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });

      if (user.role === "caretaker") {
        navigate({ to: "/caregiver" });
      } else if (user.role === "doctor") {
        navigate({ to: "/doctor" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      setErrorMessage(
        formatApiError(
          err,
          "Registration could not be completed. Please check your details and try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabels: Record<UserRole, string> = {
    patient: t("auth:patient"),
    caretaker: t("auth:caretaker"),
    doctor: t("auth:doctor"),
    admin: "Admin",
  };

  return (
    <div className="min-h-screen bg-[#0A1420] text-[#E8ECEF] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <AppLogo size="lg" />
        <h1 className="mt-6 text-3xl font-display font-bold tracking-tight text-[#E8ECEF]">
          {t("auth:registerTitle")}
        </h1>
        <p className="mt-2 text-base text-[#8A99A8] font-medium">{t("auth:registerSubtitle")}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-8 sm:p-10 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              <AlertCircle size={20} className="shrink-0 text-rose-400" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="block text-sm font-bold text-[#E8ECEF] mb-2">
                {t("auth:fullName")}
              </Label>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lalita Devi"
                className="h-12 text-base bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl focus-visible:ring-[#6FAF9A] shadow-sm"
              />
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-bold text-[#E8ECEF] mb-2">
                {t("auth:email")}
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-12 text-base bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl focus-visible:ring-[#6FAF9A] shadow-sm"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="block text-sm font-bold text-[#E8ECEF] mb-2">
                {t("auth:phone")}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-12 text-base bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl focus-visible:ring-[#6FAF9A] shadow-sm"
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-bold text-[#E8ECEF] mb-2">
                {t("auth:password")}
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 text-base bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl focus-visible:ring-[#6FAF9A] shadow-sm"
              />
            </div>

            <div>
              <Label className="block text-sm font-bold text-[#E8ECEF] mb-2">{t("auth:role")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["patient", "caretaker", "doctor"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-2 rounded-2xl border text-xs sm:text-sm font-bold capitalize transition-all ${
                      role === r
                        ? "border-[#6FAF9A] bg-[#6FAF9A] text-[#0A1420] shadow-sm font-bold"
                        : "border-white/10 bg-[#0A1420] text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5"
                    }`}
                  >
                    {roleLabels[r]?.split(" ")[0] || r}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="touch"
              className="w-full text-base sm:text-lg mt-3 font-bold rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] shadow-lg shadow-[#6FAF9A]/20"
            >
              {isLoading ? (
                t("common:loading")
              ) : (
                <>
                  <UserPlus size={20} className="mr-2" /> {t("auth:registerButton")}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#8A99A8] font-medium">
            {t("auth:alreadyHaveAccount")}{" "}
            <Link to="/login" className="font-bold text-[#6FAF9A] hover:underline">
              {t("common:signIn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
