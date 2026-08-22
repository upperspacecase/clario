// Written intake (PRD §7.3). Four actions on one route:
//   POST {action:"start"}  -> create assessment + consent, email resume link
//   POST {action:"save"}   -> merge draft answers (save-and-resume)
//   POST {action:"resume"} -> return saved state for an emailed link
//   POST {action:"submit"} -> write observation, enqueue report job

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { signAssessToken, verifyAssessToken } from "@/lib/assess-token";
import { isWorkflowId, getWorkflow } from "@/lib/taxonomy";
import { SCHEMA_VERSION } from "@/lib/assessment-schema";
import { enqueueJob } from "@/lib/jobs";
import { logEvent } from "@/lib/events";
import { sendAssessResumeLink } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 120;
const MAX_TEXT = 4000;

const FORM_CONSENT_VERSION = "form_terms_v1";
const FORM_CONSENT_TEXT =
  "I agree that Hours may store my answers and email me the assessment report.";

function s(input: unknown, max = MAX_LEN): string | null {
  if (typeof input !== "string") return null;
  const t = input.trim().slice(0, max);
  return t.length > 0 ? t : null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  try {
    if (action === "start") return await start(req, body);
    if (action === "save") return await save(body);
    if (action === "resume") return await resume(body);
    if (action === "submit") return await submit(body);
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error(`[assess] ${action} failed:`, err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

async function start(req: Request, body: Record<string, unknown>) {
  const firstName = s(body.firstName);
  const businessName = s(body.businessName);
  const email = s(body.email);
  const country = s(body.country, 2);
  const teamSize = s(body.teamSize, 10);
  const currency = s(body.currency, 3) ?? "USD";

  if (!firstName || !businessName || !email || !EMAIL.test(email)) {
    return NextResponse.json(
      { error: "Name, business and a valid email are required" },
      { status: 400 },
    );
  }

  const shareId = nanoid(10);
  const docRef = adminDb().collection("assessments").doc();
  const assessmentId = docRef.id;

  const consentRef = adminDb().collection("consents").doc();
  await consentRef.set({
    assessmentId,
    channel: "form",
    kind: "form_terms",
    textVersion: FORM_CONSENT_VERSION,
    text: FORM_CONSENT_TEXT,
    grantedAt: FieldValue.serverTimestamp(),
    ip: (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim(),
    userAgent: req.headers.get("user-agent"),
  });

  await docRef.set({
    id: assessmentId,
    shareId,
    schemaVersion: SCHEMA_VERSION,
    tier: "free",
    channel: "form",
    selectedWorkflows: [],
    locale: { country, timezone: s(body.timezone, 60), currency },
    parentAssessmentId: null,
    consentIds: [consentRef.id],

    firstName,
    businessName,
    website: null,
    location: country,
    teamSize,

    clientName: firstName,
    clientEmail: email,
    industry: "real_estate",
    callerRole: null,

    status: "intake_started",
    intakeDraft: null,

    voiceSessionId: null,
    voiceSessionHandles: [],
    audioStoragePath: null,
    callStartedAt: null,
    callEndedAt: null,
    callDurationSec: null,
    headline: null,
    executiveSummary: null,
    fourDayPlan: null,
    promptVersionId: null,
    pipelineVersionId: null,
    createdAt: FieldValue.serverTimestamp(),
    completedAt: null,
    emailedAt: null,
    paidAt: null,
    amountPaidUsd: null,
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    tayNotes: null,
  });

  const token = await signAssessToken(assessmentId);
  await logEvent("intake_started", { assessmentId, channel: "form" });
  void logEvent("intake_channel_selected", { assessmentId, channel: "form" });

  // Fire-and-forget: the resume email must not block the flow.
  void sendAssessResumeLink({ to: email, clientName: firstName, token });

  return NextResponse.json({ assessmentId, token });
}

async function authed(body: Record<string, unknown>) {
  const token = typeof body.token === "string" ? body.token : "";
  const payload = await verifyAssessToken(token);
  const ref = adminDb().collection("assessments").doc(payload.assessmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("assessment not found");
  return { ref, data: snap.data() as Record<string, unknown> };
}

async function save(body: Record<string, unknown>) {
  const { ref, data } = await authed(body);
  if (data.status !== "intake_started") {
    return NextResponse.json({ ok: true, alreadySubmitted: true });
  }
  const workflowId = body.workflowId;
  await ref.update({
    intakeDraft: {
      workflowId: isWorkflowId(workflowId) ? workflowId : null,
      answers: body.answers ?? {},
    },
    ...(isWorkflowId(workflowId) ? { selectedWorkflows: [workflowId] } : {}),
  });
  return NextResponse.json({ ok: true });
}

async function resume(body: Record<string, unknown>) {
  const { data } = await authed(body);
  return NextResponse.json({
    firstName: data.firstName ?? null,
    status: data.status,
    draft: data.intakeDraft ?? null,
  });
}

async function submit(body: Record<string, unknown>) {
  const { ref, data } = await authed(body);
  if (data.status !== "intake_started") {
    return NextResponse.json({ ok: true, alreadySubmitted: true });
  }

  const workflowId = body.workflowId;
  if (!isWorkflowId(workflowId) || !getWorkflow(workflowId)) {
    return NextResponse.json({ error: "Pick a workflow" }, { status: 400 });
  }
  const answers = (body.answers ?? {}) as Record<string, unknown>;
  const currentProcess = s(answers.process, MAX_TEXT);
  if (!currentProcess) {
    return NextResponse.json(
      { error: "Tell us how the workflow works today" },
      { status: 400 },
    );
  }

  const notSure = answers.timeNotSure === true;
  const min = Number(answers.timeMin);
  const max = Number(answers.timeMax);
  const timeRange =
    !notSure && Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max >= min
      ? { minHoursPerWeek: min, maxHoursPerWeek: max }
      : null;

  const assessmentId = ref.id;
  await ref.collection("observations").add({
    id: nanoid(8),
    workflowId,
    source: "form",
    currentProcess,
    owner: s(answers.owner),
    tools: (s(answers.tools, 400) ?? "")
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean),
    timeRange,
    desiredOutcome: s(answers.outcome, 400),
    verbatimQuotes: [],
    createdAt: FieldValue.serverTimestamp(),
  });

  await ref.update({
    status: "pending_processing",
    selectedWorkflows: [workflowId],
    intakeDraft: null,
    queuedForProcessingAt: FieldValue.serverTimestamp(),
  });

  await enqueueJob("generate_free_report", assessmentId);
  await logEvent("workflow_selected", { assessmentId, channel: "form", meta: { workflowId } });
  await logEvent("intake_completed", { assessmentId, channel: "form" });

  return NextResponse.json({ ok: true });
}
