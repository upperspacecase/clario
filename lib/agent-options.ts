// Single source of truth for the Gemini Live options the agent can be
// configured with. Anything that affects agent behavior lives in Firestore
// (lib/prompts.ts) but its values must come from the unions here.

// The full TTS voice set, which native-audio Live models accept. Descriptors
// are Google's own, kept here because they are what you pick by.
export const VOICES = [
  "Aoede", // breezy
  "Achernar", // soft
  "Achird", // friendly
  "Algenib", // gravelly
  "Algieba", // smooth
  "Alnilam", // firm
  "Autonoe", // bright
  "Callirrhoe", // easy-going
  "Charon", // informative
  "Despina", // smooth
  "Enceladus", // breathy
  "Erinome", // clear
  "Fenrir", // excitable
  "Gacrux", // mature
  "Iapetus", // clear
  "Kore", // firm
  "Laomedeia", // upbeat
  "Leda", // youthful
  "Orus", // firm
  "Puck", // upbeat
  "Pulcherrima", // forward
  "Rasalgethi", // informative
  "Sadachbia", // lively
  "Sadaltager", // knowledgeable
  "Schedar", // even
  "Sulafat", // warm
  "Umbriel", // easy-going
  "Vindemiatrix", // gentle
  "Zephyr", // bright
  "Zubenelgenubi", // casual
] as const;
export type VoiceId = (typeof VOICES)[number];

// Native audio carries a 128k context window against 32k on the 3.1 preview,
// which is what makes an open-ended call length viable.
export const MODELS = [
  "gemini-2.5-flash-native-audio-preview-12-2025",
  "gemini-3.1-flash-live-preview",
] as const;
export type ModelId = (typeof MODELS)[number];

export function isVoice(v: unknown): v is VoiceId {
  return typeof v === "string" && (VOICES as readonly string[]).includes(v);
}

export function isModel(v: unknown): v is ModelId {
  return typeof v === "string" && (MODELS as readonly string[]).includes(v);
}
