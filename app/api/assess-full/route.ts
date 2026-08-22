// Written Full Assessment intake — form equivalence for the paid tier
// (FR-03). shareId is the entry capability (same as /full/{shareId}); a
// scoped token covers the writes. One observation per workflow; finish
// enqueues the full engine directly — form answers need no extraction.

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { signAssessToken, verifyAssessToken } from "@/lib/assess-token";
import { isWorkflowId } from "@/lib/taxonomy";
import { enqueueJob } from "@/lib/jobs";
import { logEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT = 4000;

function s(input: unknown, max = 120): string | null {
  if (typeof input !== "string") return null;
  const t = input.trim().slice(0, max);
  return t.length > 0 ? t : null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  try {
    if (action === "start") return await start(body);
    if (action === "submit_workflow") return await submitWorkflow(body);
    if (action === "finish") return await finish(body);
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error(`[assess-full] ${action} failed:`, err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

async function start(body: Record<string, unknown>) {
  const shareId = s(body.shareId, 20);
  if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });

  const snap = await adminDb()
    .collection("assessments")
    .where("shareId", "==", shareId)
    .limit(1)
    .get();
  if (snap.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const doc = snap.docs[0];
  const a = doc.data();
  if (a.tier !== "full") return NextResponse.json({ error: "Not a full assessment" }, { status: 400 });
  if (!a.paidAt) return NextResponse.json({ error: "Payment required first" }, { status: 402 });
  if (["pending_processing", "processing", "manual_review", "complete"].includes(a.status)) {
    return NextResponse.json({ error: "This assessment is already submitted" }, { status: 409 });
  }

  await doc.ref.update({ channel: "form", status: "intake_started" });
  const obs = await doc.ref.collection("observations").get();
  const covered = obs.docs.map((d) => d.data().workflowId as string);
  const token = await signAssessToken(doc.id);
  void logEvent("intake_channel_selected", { assessmentId: doc.id, channel: "form", meta: { tier: "full" } });
  void logEvent("intake_started", { assessmentId: doc.id, channel: "form", meta: { tier: "full" } });
  return NextResponse.json({ token, covered, firstName: a.firstName ?? null });
}

async function authed(body: Record<string, unknown>) {
  const token = typeof body.token === "string" ? body.token : "";
  const payload = await verifyAssessToken(token);
  const ref = adminDb().collection("assessments").doc(payload.assessmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("assessment not found");
  const data = snap.data() as Record<string, unknown>;
  if (data.tier !== "full" || !data.paidAt) throw new Error("not an active full assessment");
  return { ref, data };
}

async function submitWorkflow(body: Record<string, unknown>) {
  const { ref } = await authed(body);
  const workflowId = body.workflowId;
  if (!isWorkflowId(workflowId)) {
    return NextResponse.json({ error: "Invalid workflow" }, { status: 400 });
  }
  const answers = (body.answers ?? {}) as Record<string, unknown>;
  const currentProcess = s(answers.process, MAX_TEXT);
  if (!currentProcess) {
    return NextResponse.json({ error: "Describe how it works today" }, { status: 400 });
  }

  const notSure = answers.timeNotSure === true;
  const min = Number(answers.timeMin);
  const max = Number(answers.timeMax);
  const timeRange =
    !notSure && Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max >= min
      ? { minHoursPerWeek: min, maxHoursPerWeek: max }
      : null;

  // Replace any earlier observation for the same workflow (carried-forward or
  // a re-submit) — one observation per workflow, latest wins.
  const existing = await ref
    .collection("observations")
    .where("workflowId", "==", workflowId)
    .get();
  for (const d of existing.docs) await d.ref.delete();

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
  return NextResponse.json({ ok: true });
}

async function finish(body: Record<string, unknown>) {
  const { ref } = await authed(body);
  const obs = await ref.collection("observations").get();
  if (obs.empty) {
    return NextResponse.json(
      { error: "Cover at least one workflow before finishing" },
      { status: 400 },
    );
  }
  await ref.update({
    status: "processing",
    selectedWorkflows: [...new Set(obs.docs.map((d) => d.data().workflowId as string))],
    queuedForProcessingAt: FieldValue.serverTimestamp(),
  });
  await enqueueJob("generate_full_report", ref.id);
  await logEvent("intake_completed", { assessmentId: ref.id, channel: "form", meta: { tier: "full" } });
  return NextResponse.json({ ok: true });
}
