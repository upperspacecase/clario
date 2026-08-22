// Full-call extraction: one observation per workflow the customer discussed,
// then chains into the full engine.

import { GoogleGenAI, Type } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "./firebase-admin";
import { WORKFLOWS, getWorkflow } from "./taxonomy";
import { enqueueJob } from "./jobs";

const REPORT_MODEL = process.env.REPORT_MODEL ?? "gemini-3-flash-preview";

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    observations: {
      type: Type.ARRAY,
      description: "One entry per workflow the customer meaningfully discussed",
      items: {
        type: Type.OBJECT,
        properties: {
          workflowId: { type: Type.STRING },
          currentProcess: { type: Type.STRING },
          owner: { type: Type.STRING },
          tools: { type: Type.ARRAY, items: { type: Type.STRING } },
          timeKnown: { type: Type.BOOLEAN },
          timeMinHoursPerWeek: { type: Type.NUMBER },
          timeMaxHoursPerWeek: { type: Type.NUMBER },
          desiredOutcome: { type: Type.STRING },
          verbatimQuotes: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          "workflowId", "currentProcess", "owner", "tools", "timeKnown",
          "timeMinHoursPerWeek", "timeMaxHoursPerWeek", "desiredOutcome", "verbatimQuotes",
        ],
      },
    },
  },
  required: ["observations"],
} as const;

export async function extractFullObservations(assessmentId: string): Promise<void> {
  const db = adminDb();
  const ref = db.collection("assessments").doc(assessmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`assessment ${assessmentId} not found`);

  const turnsSnap = await ref.collection("transcript").orderBy("timestamp", "asc").get();
  const transcript = turnsSnap.docs
    .map((d) => d.data())
    .filter((t) => t.isFinal !== false)
    .map((t) => `${t.role === "agent" ? "Sam" : "Customer"}: ${t.text}`)
    .join("\n");
  if (transcript.trim().length < 200) throw new Error("transcript too short for full extraction");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const result = await ai.models.generateContent({
    model: REPORT_MODEL,
    contents: [
      "Extract the customer's description of each workflow they meaningfully discussed on this call.",
      "Valid workflowId values: " + WORKFLOWS.map((w) => `${w.id} (${w.label})`).join(", "),
      "Rules: use only what the customer said; verbatimQuotes must be exact customer sentences; skip workflows that were only mentioned in passing; timeKnown false when no usable estimate was given.",
      "",
      transcript,
    ].join("\n"),
    config: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.1 },
  });
  const out = JSON.parse(result.text ?? "{}") as {
    observations: {
      workflowId: string; currentProcess: string; owner: string; tools: string[];
      timeKnown: boolean; timeMinHoursPerWeek: number; timeMaxHoursPerWeek: number;
      desiredOutcome: string; verbatimQuotes: string[];
    }[];
  };

  const valid = (out.observations ?? []).filter(
    (o) => getWorkflow(o.workflowId) && o.currentProcess?.trim(),
  );
  if (valid.length === 0) throw new Error("full extraction produced no observations");

  // Phone observations supersede any carried-forward form data for the same
  // workflow — the call went deeper.
  const existing = await ref.collection("observations").get();
  const phoneWorkflows = new Set(valid.map((o) => o.workflowId));
  for (const doc of existing.docs) {
    if (phoneWorkflows.has(doc.data().workflowId)) await doc.ref.delete();
  }

  for (const o of valid) {
    const min = Math.max(0, o.timeMinHoursPerWeek);
    const max = Math.max(min, o.timeMaxHoursPerWeek);
    await ref.collection("observations").add({
      id: nanoid(8),
      workflowId: o.workflowId,
      source: "phone",
      currentProcess: o.currentProcess.trim(),
      owner: o.owner.trim() || null,
      tools: o.tools.map((t) => t.trim()).filter(Boolean),
      timeRange: o.timeKnown ? { minHoursPerWeek: min, maxHoursPerWeek: max } : null,
      desiredOutcome: o.desiredOutcome.trim() || null,
      verbatimQuotes: o.verbatimQuotes.slice(0, 5),
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await ref.update({
    selectedWorkflows: valid.map((o) => o.workflowId),
    status: "processing",
  });
  await enqueueJob("generate_full_report", assessmentId);
}
