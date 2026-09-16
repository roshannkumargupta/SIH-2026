import { X, Gamepad2, Calendar, BarChart3, HelpCircle, Heart } from "lucide-react";
import type { VoiceLanguageCode } from "../types/voice.types";

interface VoiceCommandHelpProps {
  language: VoiceLanguageCode;
  onClose: () => void;
}

export function VoiceCommandHelp({ language, onClose }: VoiceCommandHelpProps) {
  const shortLang = language.slice(0, 2);

  const commandCategories = [
    {
      icon: <Gamepad2 size={20} className="text-sun" />,
      title: shortLang === "hi" ? "गेम्स और दिमागी कसरत" : "Cognitive Games",
      examples:
        shortLang === "hi"
          ? [
              "'गेम खोलो'",
              "'वॉटर जग खोलो'",
              "'टावर ऑफ हनोई खोलो'",
              "'मेमोरी गेम खोलो'",
              "'अगला गेम'",
            ]
          : shortLang === "as"
            ? ["'খেল খোলক'", "'পানীৰ জগ খেল'", "'মেমৰি গেম'", "'পৰৱৰ্তী খেল'"]
            : [
                "'Play games'",
                "'Open water jugs'",
                "'Play tower of hanoi'",
                "'Open memory match'",
                "'Next game'",
              ],
    },
    {
      icon: <Calendar size={20} className="text-tea-confirm" />,
      title: shortLang === "hi" ? "दवा और दिनचर्या" : "Routine & Medication",
      examples:
        shortLang === "hi"
          ? [
              "'आज मुझे क्या करना है?'",
              "'मेरे रिमाइंडर दिखाओ'",
              "'दवा का शेड्यूल खोलो'",
              "'अगला रिमाइंडर'",
            ]
          : shortLang === "as"
            ? ["'আজি মই কি কৰিব লাগিব?'", "'সোঁৱৰণী দেখুওৱা'", "'ঔষধ তালিকা'", "'পৰৱৰ্তী কাম'"]
            : [
                "'What should I do today?'",
                "'Show my reminders'",
                "'Open medication schedule'",
                "'Next reminder'",
              ],
    },
    {
      icon: <BarChart3 size={20} className="text-fire" />,
      title: shortLang === "hi" ? "प्रोग्रेस और एनालिटिक्स" : "Progress & Health",
      examples:
        shortLang === "hi"
          ? ["'मेरी प्रोग्रेस दिखाओ'", "'मेरा स्कोर क्या है?'", "'एनालिटिक्स रिपोर्ट'"]
          : ["'Show my progress'", "'What is my cognitive score?'", "'Open analytics dashboard'"],
    },
    {
      icon: <Heart size={20} className="text-sun" />,
      title: shortLang === "hi" ? "पारिवारिक यादें" : "Memories & Care",
      examples:
        shortLang === "hi"
          ? ["'यादें दिखाओ'", "'पारिवारिक फोटो खोलो'", "'केयरगिवर डैशबोर्ड'"]
          : ["'Open family memories'", "'Show my photo album'", "'Open caregiver dashboard'"],
    },
  ];

  return (
    <div className="rounded-2xl border border-clay bg-surface p-6 shadow-card space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-clay pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sun/20 text-sun">
            <HelpCircle size={22} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-cream">
              {shortLang === "hi" ? "आवाज़ कमांड गाइड" : "Voice Commands Guide"}
            </h3>
            <p className="text-xs text-cream/70">
              {shortLang === "hi"
                ? "आप माइक दबाकर या नीचे टाइप करके ये कमांड बोल सकते हैं"
                : "Speak or type any of these natural commands"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-cream/60 hover:text-cream hover:bg-clay/50 transition"
          aria-label="Close help"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {commandCategories.map((cat, idx) => (
          <div key={idx} className="rounded-xl border border-clay bg-ink/60 p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-cream text-sm">
              {cat.icon}
              <span>{cat.title}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-cream/80">
              {cat.examples.map((ex, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-sun">•</span>
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
