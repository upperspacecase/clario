// Estimates { hoursPerWeek, teamSize, hourlyRate } for the cost/benefit
// calculator on the payment page, by reading the call transcript and asking
// Gemini to pull plausible numbers from what the caller said. Cached on the
// assessment doc as `numbersEstimate` so subsequent loads are free.
//
// Requires GEMINI_API_KEY in the Vercel environment.

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenAI, Type } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_MODEL = process.env.REPORT_MODEL ?? "gemini-3-flash-preview";
const FALLBACK = { hoursPerWeek: 6, teamSize: 12, hourlyRate: 45 };

interface NumbersEstimate {
  hoursPerWeek: number;
  teamSize: number;
  hourlyRate: number;
  source: "transcript" | "fallback";
  generatedAt?: number;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

async function loadTranscriptText(assessmentId: string): Promise<string> {
  const snap = await adminDb()
    .collection("assessments")
    .doc(assessmentId)
    .collection("transcript")
    .orderBy("turnId", "asc")
    .get();
  const lines: string[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const role = data.role === "agent" ? "Sam" : "Caller";
    const text = typeof data.text === "string" ? data.text : "";
    if (text.trim()) lines.push(`${role}: ${text.trim()}`);
  }
  return lines.join("\n");
}

async function extractFromTranscript(
  transcript: string,
): Promise<NumbersEstimate | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[estimate-numbers] GEMINI_API_KEY missing");
    return null;
  }
  if (!transcript.trim()) return null;

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: REPORT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are extracting structured numbers from a transcript of a discovery call between Sam (an AI interviewer) and a business operator. Read the transcript and return the caller's:

- hoursPerWeek: average hours per week the caller (or their team members) lose to repetitive admin, manual handoffs, missed follow-up, or similar wasted-time activities. Per-person average, not team total. Integer 1–40.
- teamSize: total team size of the caller's business including the caller. Integer 1–50.
- hourlyRate: a reasonable USD/hour rate for the kind of work being lost. Integer 20–200. If not mentioned, infer from role/industry (e.g., trades $45, professional services $75, owner/operator $90).

If the transcript is empty or you genuinely can't tell, use these defaults: hoursPerWeek=6, teamSize=12, hourlyRate=45.

Transcript:
${transcript}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hoursPerWeek: { type: Type.INTEGER },
          teamSize: { type: Type.INTEGER },
          hourlyRate: { type: Type.INTEGER },
        },
        required: ["hoursPerWeek", "teamSize", "hourlyRate"],
      },
    },
  });

  const raw = result.text;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      hoursPerWeek: clamp(Number(parsed.hoursPerWeek), 1, 40),
      teamSize: clamp(Number(parsed.teamSize), 1, 50),
      hourlyRate: clamp(Number(parsed.hourlyRate), 20, 200),
      source: "transcript",
    };
  } catch (e) {
    console.error("[estimate-numbers] JSON parse failed:", e, raw);
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  const { assessmentId } = await params;

  try {
    const docRef = adminDb().collection("assessments").doc(assessmentId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const cached = docSnap.data()?.numbersEstimate as
      | NumbersEstimate
      | undefined;
    if (
      cached &&
      Number.isFinite(cached.hoursPerWeek) &&
      Number.isFinite(cached.teamSize) &&
      Number.isFinite(cached.hourlyRate)
    ) {
      return NextResponse.json(cached);
    }

    const transcript = await loadTranscriptText(assessmentId);
    const extracted = await extractFromTranscript(transcript);
    const estimate: NumbersEstimate = extracted ?? {
      ...FALLBACK,
      source: "fallback",
    };
    const toWrite = { ...estimate, generatedAt: Date.now() };
    await docRef.update({
      numbersEstimate: toWrite,
      numbersEstimateUpdatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(toWrite);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[estimate-numbers] failed:", msg);
    return NextResponse.json({ ...FALLBACK, source: "fallback" });
  }
}
