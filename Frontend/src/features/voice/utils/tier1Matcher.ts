/**
 * Deterministic, zero-latency Tier 1 intent and entity matcher for all 11 languages.
 * Scored matching, active language first, specificity ordering, no language branching.
 */

import type { VoiceLanguageCode, InterpretResult, VoiceIntent } from "../types/voice.types";
import type { VoiceResource } from "../types/voicePhrases.types";
import { normalizeText } from "./normalizeText";
import { ROMANIZED_PHRASES, ROMANIZED_GAMES } from "../config/romanizedPhrases";

import { en } from "@/i18n/resources/en";
import { hi } from "@/i18n/resources/hi";
import { te } from "@/i18n/resources/te";
import { ta } from "@/i18n/resources/ta";
import { mr } from "@/i18n/resources/mr";
import { gu } from "@/i18n/resources/gu";
import { bn } from "@/i18n/resources/bn";
import { as } from "@/i18n/resources/as";
import { ne } from "@/i18n/resources/ne";
import { mni } from "@/i18n/resources/mni";
import { brx } from "@/i18n/resources/brx";

const VOICE_RESOURCES: Record<string, VoiceResource> = {
  en: en.voice,
  "en-in": en.voice,
  hi: hi.voice,
  "hi-in": hi.voice,
  te: te.voice,
  "te-in": te.voice,
  ta: ta.voice,
  "ta-in": ta.voice,
  mr: mr.voice,
  "mr-in": mr.voice,
  gu: gu.voice,
  "gu-in": gu.voice,
  bn: bn.voice,
  "bn-in": bn.voice,
  as: as.voice,
  "as-in": as.voice,
  ne: ne.voice,
  "ne-in": ne.voice,
  mni: mni.voice,
  "mni-in": mni.voice,
  brx: brx.voice,
  "brx-in": brx.voice,
};

export function getVoiceResource(lang: string | undefined | null): VoiceResource {
  if (!lang) return en.voice;
  const key = lang.trim().toLowerCase();
  return VOICE_RESOURCES[key] || VOICE_RESOURCES[key.split("-")[0]!] || en.voice;
}

interface MatchCandidate {
  intent: VoiceIntent;
  score: number;
  entity: string | null;
}

/**
 * Computes match score between candidate phrase and user utterance text.
 */
function scorePhrase(text: string, phraseRaw: string): number {
  const phrase = normalizeText(phraseRaw);
  if (!phrase || !text) return 0;

  const phraseTokens = phrase.split(" ").filter(Boolean);
  const textTokens = text.split(" ").filter(Boolean);

  let score = 0;

  if (text === phrase) {
    // Exact whole-phrase match
    score = 1.0;
  } else if (text.startsWith(phrase + " ") || text.endsWith(" " + phrase) || text.includes(" " + phrase + " ")) {
    // Subphrase exact word boundary match
    const coverage = phrase.length / text.length;
    score = 0.70 + 0.20 * coverage;
    if (text.startsWith(phrase)) {
      score += 0.05; // Appears at beginning
    }
  } else if (text.includes(phrase)) {
    // Substring match
    score = 0.60;
    if (text.startsWith(phrase)) {
      score += 0.05;
    }
  } else {
    // Token overlap
    let matched = 0;
    for (const pt of phraseTokens) {
      if (textTokens.includes(pt)) {
        matched++;
      }
    }
    if (matched === phraseTokens.length && phraseTokens.length > 1) {
      score = 0.70;
    } else if (matched > 0 && phraseTokens.length > 1) {
      score = 0.45 * (matched / phraseTokens.length);
    }
  }

  // Penalty for single short tokens < 4 chars (e.g. "help" inside complex sentence)
  if (phraseTokens.length === 1 && phrase.length < 4) {
    score -= 0.35;
  }

  return Math.min(1.0, Math.max(0, score));
}

/**
 * Deterministically interprets user voice text into intent and entity.
 */
export function tier1Match(raw: string, lang: VoiceLanguageCode = "en-IN"): InterpretResult {
  const text = normalizeText(raw);
  if (!text) {
    return { intent: "UNKNOWN", confidence: 0, entity: null, debug: { tier: "tier1_local" } };
  }

  const activeRes = getVoiceResource(lang);
  let best: MatchCandidate = { intent: "UNKNOWN", score: 0, entity: null };

  // Helper to test and update best
  const evaluate = (intent: VoiceIntent, phrase: string, entity: string | null = null, bonus = 0) => {
    const s = scorePhrase(text, phrase) + bonus;
    if (s > best.score) {
      best = { intent, score: s, entity };
    }
  };

  // 1. GAME ENTITIES (Most specific: e.g. "Water Jugs", "Tower of Hanoi")
  // Active language games
  for (const [entityKey, phrases] of Object.entries(activeRes.games)) {
    for (const p of phrases) {
      evaluate("OPEN_GAME", p, entityKey, 0.15); // +0.15 specificity bonus for named games
    }
  }

  // Romanized game entities
  for (const [entityKey, phrases] of Object.entries(ROMANIZED_GAMES)) {
    for (const p of phrases) {
      evaluate("OPEN_GAME", p, entityKey, 0.1);
    }
  }

  // English game entities (as tie-breaker if user used English game title)
  if (lang !== "en-IN") {
    for (const [entityKey, phrases] of Object.entries(en.voice.games)) {
      for (const p of phrases) {
        evaluate("OPEN_GAME", p, entityKey, 0.05);
      }
    }
  }

  // 2. ACTIVE LANGUAGE INTENT PHRASES
  for (const [intentKey, phrases] of Object.entries(activeRes.phrases)) {
    for (const p of phrases) {
      evaluate(intentKey as VoiceIntent, p, null, 0);
    }
  }

  // 3. SHARED ROMANIZED TABLE ("dawa", "khel", "score", "home")
  for (const [intentKey, phrases] of Object.entries(ROMANIZED_PHRASES)) {
    for (const p of phrases) {
      evaluate(intentKey as VoiceIntent, p, null, -0.05);
    }
  }

  // 4. ENGLISH FALLBACK TABLE (only as last resort / tie-break)
  if (lang !== "en-IN") {
    for (const [intentKey, phrases] of Object.entries(en.voice.phrases)) {
      for (const p of phrases) {
        evaluate(intentKey as VoiceIntent, p, null, -0.1);
      }
    }
  }

  // Confidence threshold: if best score < 0.6 -> UNKNOWN so higher tiers can take over
  if (best.score >= 0.58) {
    return {
      intent: best.intent,
      confidence: Math.min(Number(best.score.toFixed(2)), 0.99),
      entity: best.entity,
      debug: { tier: "tier1_local" },
    };
  }

  return {
    intent: "UNKNOWN",
    confidence: Number(best.score.toFixed(2)),
    entity: null,
    debug: { tier: "tier1_local" },
  };
}
