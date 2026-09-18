import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { House, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { formatApiError } from "../api/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | SmritiSetu" },
      { name: "description", content: "Sign in to SmritiSetu cognitive companion platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(cleanEmail, password);
      if (user.role === "caretaker") {
        navigate({ to: "/caregiver" });
      } else if (user.role === "doctor") {
        navigate({ to: "/doctor" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, "Invalid email or password. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1420] text-[#E8ECEF] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#22C55E] text-[#0A1420] shadow-sm">
            <House size={28} strokeWidth={2.5} />
          </span>
          <span className="font-display text-4xl font-bold text-[#E8ECEF]">SmritiSetu</span>
        </Link>
        <h1 className="mt-6 text-3xl font-display font-bold tracking-tight text-[#E8ECEF]">
          {t("auth:signInTitle")}
        </h1>
        <p className="mt-2 text-base text-[#8A99A8] font-medium">{t("auth:signInSubtitle")}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        {/* Credentials Login Form */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-8 sm:p-10 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              <AlertCircle size={20} className="shrink-0 text-rose-400" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="h-12 text-base bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl focus-visible:ring-[#22C55E] shadow-sm"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 text-base bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl focus-visible:ring-[#22C55E] shadow-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="touch"
              className="w-full text-base sm:text-lg mt-3 font-bold rounded-full bg-[#22C55E] text-[#0A1420] hover:bg-[#1ea850] shadow-lg shadow-[#22C55E]/20"
            >
              {isLoading ? (
                t("common:loading")
              ) : (
                <>
                  <LogIn size={20} className="mr-2" /> {t("auth:signInButton")}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#8A99A8] font-medium">
            {t("auth:dontHaveAccount")}{" "}
            <Link to="/register" className="font-bold text-[#22C55E] hover:underline">
              {t("common:register")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
