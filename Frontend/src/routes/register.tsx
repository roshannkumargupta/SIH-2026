import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { House, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { formatApiError } from "../api/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
        phone: phone.trim() || undefined,
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
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-xl bg-sun text-ink shadow-md">
            <House size={32} strokeWidth={2.5} />
          </span>
          <span className="font-display text-4xl font-bold text-cream">SmritiSetu</span>
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-cream">
          {t("auth:registerTitle")}
        </h1>
        <p className="mt-2 text-base text-cream/70">{t("auth:registerSubtitle")}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="rounded-2xl border border-clay bg-surface p-8 shadow-card">
          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-fire/60 bg-fire/15 p-4 text-sm text-cream">
              <AlertCircle size={20} className="shrink-0 text-fire" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="block text-base font-bold text-cream mb-2">
                {t("auth:fullName")}
              </Label>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lalita Devi"
                className="h-12 text-base bg-ink border-clay text-cream focus-visible:ring-sun"
              />
            </div>

            <div>
              <Label htmlFor="email" className="block text-base font-bold text-cream mb-2">
                {t("auth:email")}
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-12 text-base bg-ink border-clay text-cream focus-visible:ring-sun"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="block text-base font-bold text-cream mb-2">
                {t("auth:phone")}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-12 text-base bg-ink border-clay text-cream focus-visible:ring-sun"
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-base font-bold text-cream mb-2">
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
                className="h-12 text-base bg-ink border-clay text-cream focus-visible:ring-sun"
              />
            </div>

            <div>
              <Label className="block text-base font-bold text-cream mb-2">{t("auth:role")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["patient", "caretaker", "doctor"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-2 rounded-xl border text-xs sm:text-sm font-bold capitalize transition ${
                      role === r
                        ? "border-sun bg-sun text-ink shadow-sm"
                        : "border-clay bg-ink text-cream hover:bg-clay"
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
              variant="cream"
              size="touch"
              className="w-full text-lg mt-2 font-bold"
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

          <div className="mt-6 text-center text-sm text-cream/70">
            {t("auth:alreadyHaveAccount")}{" "}
            <Link to="/login" className="font-bold text-sun hover:underline">
              {t("common:signIn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
