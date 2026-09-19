import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface HowToPlayProps {
  title: string;
  instructions: string[];
  tips?: string[];
  defaultOpen?: boolean;
}

export function HowToPlay({ title, instructions, tips, defaultOpen = false }: HowToPlayProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { t } = useLanguage();

  return (
    <div className="rounded-3xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/[0.02] transition"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#6FAF9A]/15 text-[#6FAF9A]">
            <HelpCircle size={20} />
          </span>
          <span className="font-display text-base sm:text-lg font-bold text-[#E8ECEF]">
            {t("games:howToPlay")}: {title}
          </span>
        </div>
        <span className="text-[#8A99A8] shrink-0">
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/8 px-6 pb-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <ol className="space-y-2.5">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-[#E8ECEF]/90 font-medium">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#6FAF9A] text-[#0A1420] text-xs font-black shadow-xs">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>

          {tips && tips.length > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <p className="mb-2 text-xs font-bold uppercase text-amber-300">💡 {t("games:tips")}</p>
              <ul className="space-y-1">
                {tips.map((tip, i) => (
                  <li key={i} className="text-sm text-amber-100 flex gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
