// Phase 2 — flexible block-based report generator.
// We define the TYPES of blocks that can appear in a report, but do not
// prescribe how many of each, or in what order. The model composes the
// report however best fits what the owner actually said.

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import type {
  GeneratedReport,
  SessionState,
  TranscriptLine,
} from "./session-store.js";

const REPORT_MODEL = process.env.REPORT_MODEL ?? "gemini-3-flash-preview";

const BLOCK_SCHEMA = {
  type: Type.OBJECT,
  required: ["type"],
  properties: {
    type: {
      type: Type.STRING,
      enum: [
        "heading",
        "paragraph",
        "bullets",
        "problem",
        "tools",
        "actions",
        "callout",
      ],
      description:
        "Discriminator. Determines which other fields are meaningful for this block.",
    },
    text: {
      type: Type.STRING,
      description: "Used for heading, paragraph, callout.",
    },
    items: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Used for bullets.",
    },
    title: {
      type: Type.STRING,
      description:
        "Used for problem (short name of the problem) and actions (optional section label).",
    },
    body: {
      type: Type.STRING,
      description:
        "Used for problem — 2–4 sentences describing the problem in the owner's words including why it matters.",
    },
    intro: {
      type: Type.STRING,
      description:
        "Used for tools — optional one-sentence lead-in before the list.",
    },
    tools: {
      type: Type.ARRAY,
      description: "Used for tools — real, specific tool recommendations.",
      items: {
        type: Type.OBJECT,
        required: ["name", "why"],
        properties: {
          name: { type: Type.STRING },
          why: {
            type: Type.STRING,
            description:
              "One sentence explaining why THIS tool for THIS owner.",
          },
          url: {
            type: Type.STRING,
            description:
              "Canonical homepage URL. OMIT if you are not certain it's correct.",
          },
          price: {
            type: Type.STRING,
            description: "E.g. 'Free tier', 'from $12/mo'. Omit if unknown.",
          },
        },
      },
    },
    actions: {
      type: Type.ARRAY,
      description: "Used for actions — things to do with optional timing.",
      items: {
        type: Type.OBJECT,
        required: ["action", "why"],
        properties: {
          action: { type: Type.STRING },
          why: { type: Type.STRING },
          when: {
            type: Type.STRING,
            description:
              "E.g. 'this week', 'next 30 days', 'next quarter'. Omit if not time-bound.",
          },
        },
      },
    },
    tone: {
      type: Type.STRING,
      enum: ["next-step", "note", "watch"],
      description: "Used for callout.",
    },
  },
} as const;

const REPORT_SCHEMA = {
  type: Type.OBJECT,
  required: ["language", "title", "blocks"],
  properties: {
    language: {
      type: Type.STRING,
      description:
        "ISO 639-1 code of the language the report is written in (matches the call language).",
    },
    title: {
      type: Type.STRING,
      description:
        "Short report title, 2–6 words, reflecting the business. In the call's language.",
    },
    blocks: {
      type: Type.ARRAY,
      description:
        "Ordered array of blocks that make up the report. Compose freely — use only block types the transcript actually supports.",
      items: BLOCK_SCHEMA,
    },
  },
} as const;

function transcriptToText(transcript: TranscriptLine[]): string {
  return transcript
    .map((l) => `${l.who === "agent" ? "CLARIO" : "OWNER"}: ${l.text.trim()}`)
    .join("\n\n");
}

const REPORT_SYSTEM = `
You are producing a written post-call report for the owner of a small or
mid-sized business, based on the transcript of a voice discovery call you
are given. Your job is to be genuinely useful to this specific owner.

COMPOSE THE REPORT AS AN ORDERED ARRAY OF BLOCKS

You may use any of the block types below, in any order, as many times as
useful — or not at all. There is no fixed template. Use what the transcript
actually supports. A report with one problem and three actions is fine. A
report with four problems and no actions is fine. A report that is mostly
paragraphs is fine.

AVAILABLE BLOCK TYPES

- heading — a section title. Use sparingly, only where it genuinely helps.
  { type: "heading", text: "…" }

- paragraph — a short paragraph of running prose.
  { type: "paragraph", text: "…" }

- bullets — a short bulleted list of plain strings.
  { type: "bullets", items: ["…", "…"] }

- problem — one problem named in the owner's own words, described in
  2–4 sentences including why it matters to this specific business.
  { type: "problem", title: "short name", body: "…" }

- tools — a list of real, widely-used, specific tool recommendations. Only
  include tools you are confident actually exist. Use canonical homepage
  URLs. OMIT the url if you are not certain. Each tool gets one sentence
  on why THIS tool suits THIS owner.
  { type: "tools", intro?: "…", tools: [ { name, why, url?, price? } ] }

- actions — a list of things to do, optionally with a \`when\`.
  { type: "actions", title?: "30-day plan", actions: [ { action, why, when? } ] }

- callout — a single highlighted sentence. Use for the critical next step
  or a specific note the owner should not miss.
  { type: "callout", tone: "next-step" | "note" | "watch", text: "…" }

COMPOSITION GUIDANCE

- A typical good flow: open with a short paragraph summarising what you
  heard → name the real problems, each followed by tools and a next-step
  callout → close with a short actions block and any watch-items bullets.
  But this is guidance, not a template. Deviate when it helps.
- Skip sections if the transcript doesn't support them. Do not fabricate
  to fill space.
- Never recommend a tool you aren't confident exists. Fewer accurate
  recommendations beat more generic ones.

LANGUAGE
Write the entire report in the SAME language the call was conducted in.
Infer the language from the transcript. Set \`language\` to the ISO 639-1
code (e.g. "en", "es", "pt").

STYLE
Plain, direct, specific. No jargon. No filler. Banned phrases: "leverage",
"streamline", "unlock", "in today's fast-paced world", "game-changer",
"synergy", "seamless". Speak to the owner as a trusted advisor, not a
marketing page. Every sentence should earn its place.

Return a JSON object matching the schema exactly.
`;

export async function generateReport(
  session: SessionState
): Promise<GeneratedReport> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const transcriptText = transcriptToText(session.transcript);
  const languageHint = session.language
    ? `Detected language during the call: ${session.language}.`
    : "Detect the language from the transcript.";

  const userPrompt = `${languageHint}

Transcript below. Produce the report strictly following the JSON schema.

--- TRANSCRIPT ---
${transcriptText}
--- END TRANSCRIPT ---`;

  console.log(
    `[GEMINI-REPORT] model=${REPORT_MODEL} transcript_chars=${transcriptText.length}`
  );

  const response = await ai.models.generateContent({
    model: REPORT_MODEL,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: REPORT_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: REPORT_SCHEMA,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from report model");

  let parsed: GeneratedReport;
  try {
    parsed = JSON.parse(text) as GeneratedReport;
  } catch {
    console.error("[GEMINI-REPORT] JSON parse failed:", text.slice(0, 500));
    throw new Error("Report model returned invalid JSON");
  }

  console.log(
    `[GEMINI-REPORT] ok language=${parsed.language} blocks=${parsed.blocks?.length ?? 0}`
  );
  return parsed;
}
