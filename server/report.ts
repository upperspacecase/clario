// Phase 2 — report generator.
// Transcript -> structured JSON report via Gemini 3 Pro with thinking.

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import type {
  GeneratedReport,
  SessionState,
  TranscriptLine,
} from "./session-store.js";

const REPORT_MODEL = process.env.REPORT_MODEL ?? "gemini-3-pro";

const REPORT_SCHEMA = {
  type: Type.OBJECT,
  required: [
    "language",
    "executiveSummary",
    "businessSnapshot",
    "topProblems",
    "thirtyDayPlan",
    "watchItems",
  ],
  properties: {
    language: {
      type: Type.STRING,
      description:
        "ISO 639-1 code of the language the entire report is written in (matches the interview). e.g. 'en', 'es', 'pt', 'it', 'vi', 'fr', 'de'.",
    },
    executiveSummary: {
      type: Type.STRING,
      description:
        "3–4 sentences summarising what was heard and what the report recommends, written in the detected language.",
    },
    businessSnapshot: {
      type: Type.STRING,
      description:
        "Plain-language description of the business based only on what the owner said: industry, size, how they make money, what makes them distinctive. Written in the detected language.",
    },
    topProblems: {
      type: Type.ARRAY,
      description:
        "Exactly 3 problems, in priority order. Each includes the problem in the owner's words, why it matters, 2–3 concrete real tool recommendations, and one specific next step for this week.",
      items: {
        type: Type.OBJECT,
        required: [
          "problem",
          "whyItMatters",
          "recommendations",
          "nextStepThisWeek",
        ],
        properties: {
          problem: { type: Type.STRING },
          whyItMatters: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["name", "why", "url"],
              properties: {
                name: { type: Type.STRING },
                why: {
                  type: Type.STRING,
                  description:
                    "One sentence explaining why THIS tool fits THIS owner's situation.",
                },
                url: {
                  type: Type.STRING,
                  description:
                    "Canonical homepage URL of the real product. No invented URLs.",
                },
                startingPrice: {
                  type: Type.STRING,
                  description:
                    "Rough starting price if commonly known (e.g. 'Free tier', 'from $12/mo'). Omit if uncertain.",
                },
              },
            },
          },
          nextStepThisWeek: {
            type: Type.STRING,
            description:
              "A single concrete action the owner can take this week. Imperative, specific.",
          },
        },
      },
    },
    thirtyDayPlan: {
      type: Type.ARRAY,
      description: "Exactly 3 prioritised actions for the next 30 days.",
      items: {
        type: Type.OBJECT,
        required: ["priority", "action", "why"],
        properties: {
          priority: { type: Type.INTEGER, description: "1, 2, or 3." },
          action: { type: Type.STRING },
          why: { type: Type.STRING },
        },
      },
    },
    watchItems: {
      type: Type.ARRAY,
      description:
        "3–5 longer-term watch-items the owner should keep an eye on but not act on now.",
      items: { type: Type.STRING },
    },
  },
} as const;

function transcriptToText(transcript: TranscriptLine[]): string {
  return transcript
    .map((l) => `${l.who === "agent" ? "CLARIO" : "OWNER"}: ${l.text.trim()}`)
    .join("\n\n");
}

const REPORT_SYSTEM = `
You are writing a practical post-interview report for the owner of a small or
mid-sized business. You have the full transcript of a voice discovery call.

Your job:
1. Identify the owner's top three real problems from their own words.
2. For each problem, recommend 2–3 REAL, widely-used tools you genuinely
   know exist. Use canonical homepage URLs. Do not invent products or URLs.
   If you're not certain a URL is correct, omit the URL rather than guess.
3. Give one concrete next step per problem that can be started this week.
4. Produce a 30-day plan of three prioritised actions.
5. Include 3–5 longer-term watch-items.

Language: write the entire report in the SAME language the interview was
conducted in. Infer the language from the transcript.

Style: plain, direct, no jargon, no filler. No phrases like "leverage",
"streamline", "unlock", "in today's fast-paced world". Speak to the owner
as a trusted advisor, not a marketing page.

Never recommend a tool you are not confident is real and matches their
situation. Fewer, more accurate recommendations beat more, generic ones.
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
      thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from report model");

  let parsed: GeneratedReport;
  try {
    parsed = JSON.parse(text) as GeneratedReport;
  } catch (e) {
    console.error("[GEMINI-REPORT] JSON parse failed:", text.slice(0, 500));
    throw new Error("Report model returned invalid JSON");
  }

  console.log(
    `[GEMINI-REPORT] ok language=${parsed.language} problems=${parsed.topProblems?.length ?? 0}`
  );
  return parsed;
}
