import React from "react";
import { getLangKey } from "../../utils/voiceCommands";
import { Brain, Calendar, Compass, Sparkles } from "lucide-react";

interface VoiceCommandHelpProps {
  languageCode: string;
  onSelectCommand?: (cmd: string) => void;
}

export const VoiceCommandHelp: React.FC<VoiceCommandHelpProps> = ({
  languageCode,
  onSelectCommand,
}) => {
  const lang = getLangKey(languageCode);

  const commandCategories = {
    en: [
      {
        title: "Games & Cognitive Challenges",
        icon: <Brain className="size-4 text-sun" />,
        examples: ["Play memory match", "Open games", "Next game", "Open number puzzle"],
      },
      {
        title: "Daily Tasks & Routine",
        icon: <Calendar className="size-4 text-sun" />,
        examples: ["What should I do today?", "Show my reminders", "Tell me my next reminder"],
      },
      {
        title: "Navigation & Health",
        icon: <Compass className="size-4 text-sun" />,
        examples: ["Show my medicine", "Go home", "Show my progress", "Open caregiver hub"],
      },
      {
        title: "Accessibility & Assistant",
        icon: <Sparkles className="size-4 text-sun" />,
        examples: ["Read this page", "What can I say?", "Stop speaking"],
      },
    ],
    hi: [
      {
        title: "दिमागी खेल (Games)",
        icon: <Brain className="size-4 text-sun" />,
        examples: ["मेमोरी गेम खोलो", "गेम खोलो", "अगला गेम", "नंबर पज़ल खोलो"],
      },
      {
        title: "दैनिक कार्य और रिमाइंडर",
        icon: <Calendar className="size-4 text-sun" />,
        examples: ["आज मुझे क्या करना है?", "मेरे रिमाइंडर दिखाओ", "अगला काम क्या है?"],
      },
      {
        title: "नेविगेशन और स्वास्थ्य",
        icon: <Compass className="size-4 text-sun" />,
        examples: ["दवा दिखाओ", "घर जाओ", "मेरी प्रगति दिखाओ"],
      },
      {
        title: "सहायता",
        icon: <Sparkles className="size-4 text-sun" />,
        examples: ["स्क्रीन पढ़ो", "मदद", "बोलना बंद करो"],
      },
    ],
    as: [
      {
        title: "খেলসমূহ (Games)",
        icon: <Brain className="size-4 text-sun" />,
        examples: ["মেমৰি খেল খোলক", "খেল খোলক", "পৰৱৰ্তী খেল"],
      },
      {
        title: "দৈনিক কাৰ্যসূচী আৰু সোঁৱৰণী",
        icon: <Calendar className="size-4 text-sun" />,
        examples: ["আজি মই কি কৰিব লাগিব?", "মোৰ সোঁৱৰণী দেখুওৱা", "পৰৱৰ্তী কাম"],
      },
      {
        title: "স্বাস্থ্য আৰু সহায়",
        icon: <Compass className="size-4 text-sun" />,
        examples: ["ঔষধ দেখুওৱা", "ঘৰলৈ যাওক", "সহায়"],
      },
    ],
    bn: [
      {
        title: "গেমস (Games)",
        icon: <Brain className="size-4 text-sun" />,
        examples: ["মেমোরি গেম খুলুন", "গেম খেলুন", "পরের গেম"],
      },
      {
        title: "রুটিন ও রিমাইন্ডার",
        icon: <Calendar className="size-4 text-sun" />,
        examples: ["আজ আমি কী করব?", "আমার রিমাইন্ডার দেখান", "পরের কাজ"],
      },
      {
        title: "স্বাস্থ্য ও দিকনির্দেশনা",
        icon: <Compass className="size-4 text-sun" />,
        examples: ["ওষুধ দেখান", "হোমে যান", "সাহায্য"],
      },
    ],
    mni: [
      {
        title: "খেল (Games)",
        icon: <Brain className="size-4 text-sun" />,
        examples: ["মেমৰি খেল শানবা", "খেল থীজিনু"],
      },
      {
        title: "সোঁৱৰণী",
        icon: <Calendar className="size-4 text-sun" />,
        examples: ["নুমিদাংগী কাযর্নবী", "মতম অদুগী কাজ"],
      },
    ],
    brx: [
      {
        title: "গামি (Games)",
        icon: <Brain className="size-4 text-sun" />,
        examples: ["মেমৰি গামি বাছ", "গামি মফম"],
      },
      {
        title: "রিমাইন্ডার",
        icon: <Calendar className="size-4 text-sun" />,
        examples: ["গাবোর খামনি", "হোম পেজাও থাং"],
      },
    ],
    ne: [
      {
        title: "खेलहरू (Games)",
        icon: <Brain className="size-4 text-sun" />,
        examples: ["मेमोरी खेल खेल्नुस्", "गेम खोल्नुस्", "अर्को खेल"],
      },
      {
        title: "दैनिक कार्य र सम्झना",
        icon: <Calendar className="size-4 text-sun" />,
        examples: ["आज मैले के गर्ने?", "मेरा सम्झना देखाउनुस्"],
      },
    ],
  };

  const categories = commandCategories[lang] || commandCategories.en;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-sun flex items-center gap-2">
        <Sparkles className="size-4" /> Try Saying or Typing:
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-clay/60 bg-surface/60 p-3 text-left space-y-2"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-cream/90">
              {cat.icon}
              <span>{cat.title}</span>
            </div>
            <ul className="space-y-1.5">
              {cat.examples.map((example, eIdx) => (
                <li key={eIdx}>
                  <button
                    type="button"
                    onClick={() => onSelectCommand?.(example)}
                    className="w-full text-left text-xs text-cream/70 hover:text-sun hover:underline transition truncate"
                    title={`Click to try "${example}"`}
                  >
                    • “{example}”
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
