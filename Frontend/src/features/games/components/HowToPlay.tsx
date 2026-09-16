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
    <div className="rounded-2xl border border-clay bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sun/20 text-sun">
            <HelpCircle size={20} />
          </span>
          <span className="font-display text-lg font-bold text-cream">
            {t("games:howToPlay")}: {title}
          </span>
        </div>
        <span className="text-cream/60 shrink-0">
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-clay px-6 pb-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <ol className="space-y-2">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-cream/90">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sun text-ink text-xs font-extrabold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>

          {tips && tips.length > 0 && (
            <div className="mt-5 rounded-xl border border-sun/30 bg-sun/10 px-4 py-3">
              <p className="mb-2 text-xs font-extrabold uppercase text-sun">💡 {t("games:tips")}</p>
              <ul className="space-y-1">
                {tips.map((tip, i) => (
                  <li key={i} className="text-sm text-cream/80 flex gap-2">
                    <span className="text-sun">•</span>
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
