/**
 * Thin compatibility wrapper over universal Tier 1 deterministic matcher.
 * Replaces legacy 5-language rule matcher with 11-language scored matcher.
 */

import type { InterpretResult, VoiceLanguageCode } from "../types/voice.types";
import { tier1Match } from "./tier1Matcher";

export function clientInterpretFallback(input: string, lang = "en"): InterpretResult {
  let fullCode: VoiceLanguageCode = "en-IN";
  const clean = (lang || "en").toLowerCase().trim();

  if (clean.startsWith("hi")) fullCode = "hi-IN";
  else if (clean.startsWith("te")) fullCode = "te-IN";
  else if (clean.startsWith("ta")) fullCode = "ta-IN";
  else if (clean.startsWith("mr")) fullCode = "mr-IN";
  else if (clean.startsWith("gu")) fullCode = "gu-IN";
  else if (clean.startsWith("bn")) fullCode = "bn-IN";
  else if (clean.startsWith("as")) fullCode = "as-IN";
  else if (clean.startsWith("ne")) fullCode = "ne-IN";
  else if (clean.startsWith("mn")) fullCode = "mni-IN";
  else if (clean.startsWith("br")) fullCode = "brx-IN";
  else fullCode = "en-IN";

  return tier1Match(input, fullCode);
}
