// Phone-channel extraction: streamed transcript -> one WorkflowObservation in
// the same shape the form writes, so both channels feed one engine (FR-23).

import { GoogleGenAI, Type } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "./firebase-admin";
import { getWorkflow } from "./taxonomy";
import { enqueueJob } from "./jobs";

const REPORT_MODEL = process.env.REPORT_MODEL ?? "gemini-3-flash-preview";

const EXTRACT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    currentProcess: { type: Type.STRING, description: "The customer's process in their own words, condensed" },
    owner: { type: Type.STRING, description: "Who does the work. Empty string if not stated." },
    tools: { type: Type.ARRAY, items: { type: Type.STRING } },
    timeKnown: { type: Type.BOOLEAN, description: "Did the customer give a usable time estimate?" },
    timeMinHoursPerWeek: { type: Type.NUMBER },
    timeMaxHoursPerWeek: { type: Type.NUMBER },
    desiredOutcome: { type: Type.STRING, description: "What fixed looks like to them. Empty string if not stated." },
    verbatimQuotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Up to 5 exact quotes from the CUSTOMER only" },
  },
  required: [
    "currentProcess", "owner", "tools", "timeKnown",
    "timeMinHoursPerWeek", "timeMaxHoursPerWeek", "desiredOutcome", "verbatimQuotes",
  ],
} as const;

export async function extractObservations(assessmentId: string): Promise<void> {
  const db = adminDb();
  const ref = db.collection("assessments").doc(assessmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`assessment ${assessmentId} not found`);
  const a = snap.data() as Record<string, unknown>;

  const workflowId = (a.selectedWorkflows as string[] | undefined)?.[0];
  const workflow = workflowId ? getWorkflow(workflowId) : null;
  if (!workflow) throw new Error("no selected workflow on phone assessment");

  const turnsSnap = await ref.collection("transcript").orderBy("timestamp", "asc").get();
  const transcript = turnsSnap.docs
    .map((d) => d.data())
    .filter((t) => t.isFinal !== false)
    .map((t) => `${t.role === "agent" ? "Sam" : "Customer"}: ${t.text}`)
    .join("\n");
  if (transcript.trim().length < 80) {
    throw new Error("transcript too short to extract from");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const result = await ai.models.generateContent({
    model: REPORT_MODEL,
    contents: [
      `Extract the customer's description of the workflow "${workflow.label}" from this call transcript.`,
      "Rules: use only what the customer said; verbatimQuotes must be exact customer sentences; if they gave no usable time estimate set timeKnown to false.",
      "",
      transcript,
    ].join("\n"),
    config: {
      responseMimeType: "application/json",
      responseSchema: EXTRACT_SCHEMA,
      temperature: 0.1,
    },
  });
  const out = JSON.parse(result.text ?? "{}") as {
    currentProcess: string;
    owner: string;
    tools: string[];
    timeKnown: boolean;
    timeMinHoursPerWeek: number;
    timeMaxHoursPerWeek: number;
    desiredOutcome: string;
    verbatimQuotes: string[];
  };

  if (!out.currentProcess?.trim()) throw new Error("extraction produced no process");

  const min = Math.max(0, out.timeMinHoursPerWeek);
  const max = Math.max(min, out.timeMaxHoursPerWeek);

  await ref.collection("observations").add({
    id: nanoid(8),
    workflowId: workflow.id,
    source: "phone",
    currentProcess: out.currentProcess.trim(),
    owner: out.owner.trim() || null,
    tools: out.tools.map((t) => t.trim()).filter(Boolean),
    timeRange: out.timeKnown ? { minHoursPerWeek: min, maxHoursPerWeek: max } : null,
    desiredOutcome: out.desiredOutcome.trim() || null,
    verbatimQuotes: out.verbatimQuotes.slice(0, 5),
    createdAt: FieldValue.serverTimestamp(),
  });

  await ref.update({ status: "pending_processing", queuedForProcessingAt: FieldValue.serverTimestamp() });
  await enqueueJob("generate_free_report", assessmentId);
}
