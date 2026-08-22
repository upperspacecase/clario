// Full Assessment engine (PRD §9.2): whole-operation map, up to three
// priority recommendations, four-day plan. Same contract as the free engine —
// the model proposes, this code computes and clamps every number. Full
// reports ALWAYS hold for human approval during the pilot (FR-43); the $10k
// guarantee is evaluated at approval time, never by inflating estimates.

import { GoogleGenAI, Type } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "./firebase-admin";
import { WORKFLOWS, getWorkflow } from "./taxonomy";
import type {
  Disposition,
  EngineRecommendation,
  HoursRange,
  WorkflowObservation,
} from "./assessment-schema";
import { logEvent } from "./events";
import { sendAdminNotification } from "./email";

const REPORT_MODEL = process.env.REPORT_MODEL ?? "gemini-3-flash-preview";
const DEFAULT_WORKING_WEEKS = 46;
const DEFAULT_LOADED_HOURLY_USD = 60;

const REC_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    workflowId: { type: Type.STRING },
    taskLabel: { type: Type.STRING },
    currentStateSummary: { type: Type.STRING },
    disposition: { type: Type.STRING, enum: ["keep_human", "automate", "ai", "hand_off", "stop"] },
    recommendation: { type: Type.STRING },
    toolOrApproach: { type: Type.STRING },
    setupSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
    recurringMonthlyCostUsd: { type: Type.NUMBER },
    recoverableMinHoursPerWeek: { type: Type.NUMBER },
    recoverableMaxHoursPerWeek: { type: Type.NUMBER },
    customerQuotes: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidenceLevel: { type: Type.STRING, enum: ["high", "medium", "low"] },
    confidenceReason: { type: Type.STRING },
    agentPrompt: { type: Type.STRING },
  },
  required: [
    "workflowId", "taskLabel", "currentStateSummary", "disposition",
    "recommendation", "toolOrApproach", "setupSteps", "recurringMonthlyCostUsd",
    "recoverableMinHoursPerWeek", "recoverableMaxHoursPerWeek",
    "customerQuotes", "confidenceLevel", "confidenceReason", "agentPrompt",
  ],
} as const;

const FULL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    workflowMap: {
      type: Type.ARRAY,
      description: "One entry per workflow the customer discussed",
      items: {
        type: Type.OBJECT,
        properties: {
          workflowId: { type: Type.STRING },
          summary: { type: Type.STRING, description: "One sentence on the current state, from their answers" },
          timeKnown: { type: Type.BOOLEAN },
          timeMinHoursPerWeek: { type: Type.NUMBER },
          timeMaxHoursPerWeek: { type: Type.NUMBER },
          opportunity: { type: Type.STRING, enum: ["high", "medium", "low", "unknown"] },
        },
        required: ["workflowId", "summary", "timeKnown", "timeMinHoursPerWeek", "timeMaxHoursPerWeek", "opportunity"],
      },
    },
    focusWorkflowIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The one or two workflows deserving focus" },
    recommendations: { type: Type.ARRAY, items: REC_SCHEMA, description: "Up to three, ordered by priority" },
    fourDayPlan: {
      type: Type.ARRAY,
      description: "Four days, up to three priority changes spread across them",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.NUMBER },
          action: { type: Type.STRING },
          owner: { type: Type.STRING },
          timeRequired: { type: Type.STRING },
          test: { type: Type.STRING, description: "How they know it worked" },
        },
        required: ["day", "action", "owner", "timeRequired", "test"],
      },
    },
    executiveSummary: { type: Type.STRING, description: "Three sentences, plain language, their words where possible" },
  },
  required: ["workflowMap", "focusWorkflowIds", "recommendations", "fourDayPlan", "executiveSummary"],
} as const;

interface RawRec {
  workflowId: string;
  taskLabel: string;
  currentStateSummary: string;
  disposition: Disposition;
  recommendation: string;
  toolOrApproach: string;
  setupSteps: string[];
  recurringMonthlyCostUsd: number;
  recoverableMinHoursPerWeek: number;
  recoverableMaxHoursPerWeek: number;
  customerQuotes: string[];
  confidenceLevel: "high" | "medium" | "low";
  confidenceReason: string;
  agentPrompt: string;
}

export async function generateFullReport(assessmentId: string): Promise<void> {
  const db = adminDb();
  const ref = db.collection("assessments").doc(assessmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`assessment ${assessmentId} not found`);
  const a = snap.data() as Record<string, unknown>;

  const obsSnap = await ref.collection("observations").get();
  const observations = obsSnap.docs.map((d) => d.data() as WorkflowObservation);
  if (observations.length === 0) throw new Error("no observations");

  const locale = (a.locale as { country?: string | null; currency?: string } | undefined) ?? {};
  const obsText = observations
    .map((o) => {
      const w = getWorkflow(o.workflowId);
      return [
        `### ${w?.label ?? o.workflowId} (${o.workflowId})`,
        `Process: ${o.currentProcess}`,
        `Owner: ${o.owner ?? "not stated"} | Tools: ${o.tools.join(", ") || "not stated"}`,
        `Time: ${o.timeRange ? `${o.timeRange.minHoursPerWeek}-${o.timeRange.maxHoursPerWeek} hrs/week` : "not sure"}`,
        `Fixed looks like: ${o.desiredOutcome ?? "not stated"}`,
        o.verbatimQuotes.length ? `Quotes: ${o.verbatimQuotes.map((q) => JSON.stringify(q)).join(", ")}` : "",
      ].join("\n");
    })
    .join("\n\n");

  const prompt = [
    `You are the assessment engine for Hours. A real-estate team completed a full assessment across their operation. Team size: ${a.teamSize ?? "not stated"}. Country: ${locale.country ?? "not stated"}.`,
    "",
    "Valid workflowId values: " + WORKFLOWS.map((w) => w.id).join(", "),
    "",
    "Their answers by workflow:",
    obsText,
    "",
    "Produce: (1) a workflow map covering the workflows they discussed, (2) the one or two workflows deserving focus, (3) UP TO THREE priority recommendations — fewer is fine, never more, (4) a four-day plan covering only those recommendations, (5) a three-sentence executive summary.",
    "",
    "Hard rules:",
    "- Use ONLY what the customer said. No invented statistics or industry averages.",
    "- customerQuotes must be verbatim phrases from their answers.",
    "- Recoverable hours must be a defensible reduction of THEIR stated time. Unsure time = small ranges + low confidence.",
    "- Tools must be real, currently available, appropriate for their country; otherwise describe the approach generically and say so.",
    "- Time savings only; never promise revenue.",
    "- Every workflow they did not meaningfully discuss gets opportunity \"unknown\" — never guess.",
  ].join("\n");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const result = await ai.models.generateContent({
    model: REPORT_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: FULL_SCHEMA, temperature: 0.3 },
  });
  const out = JSON.parse(result.text ?? "{}") as {
    workflowMap: {
      workflowId: string; summary: string; timeKnown: boolean;
      timeMinHoursPerWeek: number; timeMaxHoursPerWeek: number;
      opportunity: "high" | "medium" | "low" | "unknown";
    }[];
    focusWorkflowIds: string[];
    recommendations: RawRec[];
    fourDayPlan: { day: number; action: string; owner: string; timeRequired: string; test: string }[];
    executiveSummary: string;
  };

  const weeks = DEFAULT_WORKING_WEEKS;
  const hourly = DEFAULT_LOADED_HOURLY_USD;
  const statedByWorkflow = new Map<string, HoursRange | null>(
    observations.map((o) => [o.workflowId, o.timeRange]),
  );

  const recommendations: EngineRecommendation[] = out.recommendations
    .slice(0, 3)
    .filter((r) => getWorkflow(r.workflowId))
    .map((r, i) => {
      const stated = statedByWorkflow.get(r.workflowId) ?? null;
      let min = Math.max(0, r.recoverableMinHoursPerWeek);
      let max = Math.max(min, r.recoverableMaxHoursPerWeek);
      if (stated && max > stated.maxHoursPerWeek) {
        max = stated.maxHoursPerWeek;
        min = Math.min(min, max);
      }
      const toolAnnual = Math.max(0, r.recurringMonthlyCostUsd) * 12;
      return {
        id: `rec_${assessmentId}_${i + 1}`,
        workflowId: r.workflowId as EngineRecommendation["workflowId"],
        taskLabel: r.taskLabel,
        currentState: r.currentStateSummary,
        disposition: r.disposition,
        recommendation: r.recommendation,
        toolOrApproach: r.toolOrApproach.trim() || null,
        setupSteps: r.setupSteps.slice(0, 6),
        cost: {
          oneTimeUsd: null,
          recurringMonthlyUsd: r.recurringMonthlyCostUsd > 0 ? r.recurringMonthlyCostUsd : null,
          sourceDate: null,
        },
        impact: {
          recoverableRange: { minHoursPerWeek: min, maxHoursPerWeek: max },
          annualValueRange: {
            minUsd: Math.max(0, Math.round(min * weeks * hourly - toolAnnual)),
            maxUsd: Math.max(0, Math.round(max * weeks * hourly - toolAnnual)),
          },
          revenueUpsideNote: null,
        },
        evidence: {
          customerQuotes: r.customerQuotes.slice(0, 4),
          externalSources: [],
          benchmarkState: "self_reported" as const,
        },
        confidence: { level: r.confidenceLevel, reason: r.confidenceReason },
        agentPrompt: r.agentPrompt.trim() || null,
        assumptions: { workingWeeksPerYear: weeks, loadedHourlyCostUsd: hourly, currency: locale.currency ?? "USD" },
      };
    });

  // Guarantee arithmetic (§5.1): summed midpoints of recoverable annual value.
  const guaranteeTotalUsd = recommendations.reduce(
    (sum, r) => sum + Math.round((r.impact.annualValueRange.minUsd + r.impact.annualValueRange.maxUsd) / 2),
    0,
  );
  const guaranteeMet = guaranteeTotalUsd >= 10_000;

  for (const rec of recommendations) {
    await ref.collection("recommendations").doc(rec.id).set(rec);
  }

  const shareId = a.shareId as string;
  await db.collection("publicReports").doc(shareId).set({
    kind: "full_v1",
    reportVersion: 1,
    approved: false,
    assessmentId,
    clientName: (a.clientName as string | null) ?? "",
    businessName: (a.businessName as string | null) ?? "",
    executiveSummary: out.executiveSummary,
    workflowMap: out.workflowMap
      .filter((w) => getWorkflow(w.workflowId))
      .map((w) => ({
        workflowId: w.workflowId,
        label: getWorkflow(w.workflowId)!.label,
        summary: w.summary,
        timeRange: w.timeKnown
          ? { minHoursPerWeek: Math.max(0, w.timeMinHoursPerWeek), maxHoursPerWeek: Math.max(0, w.timeMaxHoursPerWeek) }
          : null,
        opportunity: w.opportunity,
      })),
    focusWorkflowIds: out.focusWorkflowIds.filter((id) => getWorkflow(id)),
    recommendations,
    fourDayPlan: out.fourDayPlan.slice(0, 8),
    guaranteeTotalUsd,
    guaranteeMet,
    markdown: renderFullMarkdown(a, out.executiveSummary, recommendations, guaranteeTotalUsd),
    generatedAt: FieldValue.serverTimestamp(),
  }, { merge: false });

  // Pilot rule: every full report waits for approval. The admin console
  // delivers it (and triggers the refund path when the guarantee fails).
  await ref.update({ status: "manual_review" });
  await logEvent("report_generated", {
    assessmentId,
    meta: { kind: "full_v1", guaranteeTotalUsd, guaranteeMet },
  });
  await sendAdminNotification({
    businessName: (a.businessName as string | null) ?? "Unknown business",
    assessmentId,
    shareId,
  });
}

function renderFullMarkdown(
  a: Record<string, unknown>,
  executiveSummary: string,
  recs: EngineRecommendation[],
  guaranteeTotalUsd: number,
): string {
  return [
    `# Hours Full Assessment${a.businessName ? ` — ${a.businessName}` : ""}`,
    "",
    "## Executive summary",
    executiveSummary,
    "",
    `Estimated recoverable value across priorities: ~$${guaranteeTotalUsd.toLocaleString()}/year (midpoint of ranges; assumptions: 46 working weeks, $60/hr loaded cost — based on the customer's own answers, no external benchmark applied).`,
    "",
    ...recs.flatMap((r, i) => [
      `## Priority ${i + 1}: ${r.taskLabel} (${r.disposition.replace("_", " ")})`,
      r.recommendation,
      r.toolOrApproach ? `Tool or approach: ${r.toolOrApproach}` : "",
      `Recoverable: ${r.impact.recoverableRange.minHoursPerWeek}-${r.impact.recoverableRange.maxHoursPerWeek} hrs/week ≈ $${r.impact.annualValueRange.minUsd.toLocaleString()}-$${r.impact.annualValueRange.maxUsd.toLocaleString()}/year`,
      `Confidence: ${r.confidence.level} — ${r.confidence.reason}`,
      ...r.setupSteps.map((s, j) => `${j + 1}. ${s}`),
      ...(r.agentPrompt ? ["", "Agent prompt:", "```", r.agentPrompt, "```"] : []),
      "",
    ]),
  ].join("\n");
}
