// Single source of truth for the Gemini Live options the agent can be
// configured with. Anything that affects agent behavior lives in Firestore
// (lib/prompts.ts) but its values must come from the unions here.

export const VOICES = [
  "Aoede",
  "Charon",
  "Fenrir",
  "Kore",
  "Puck",
  "Leda",
  "Orus",
  "Zephyr",
] as const;
export type VoiceId = (typeof VOICES)[number];

export const MODELS = ["gemini-3.1-flash-live-preview"] as const;
export type ModelId = (typeof MODELS)[number];

export function isVoice(v: unknown): v is VoiceId {
  return typeof v === "string" && (VOICES as readonly string[]).includes(v);
}

export function isModel(v: unknown): v is ModelId {
  return typeof v === "string" && (MODELS as readonly string[]).includes(v);
}
