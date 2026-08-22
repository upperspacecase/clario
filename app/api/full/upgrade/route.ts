// Free -> Full upgrade (PRD §6.2). Creates the full assessment carrying the
// free data forward (no re-entry), then sends the customer to checkout.
// GET so the report page can use a plain link; idempotent via existing child.

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { SCHEMA_VERSION } from "@/lib/assessment-schema";
import { logEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shareId = url.searchParams.get("shareId")?.trim();
  if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });

  const db = adminDb();
  const parentSnap = await db
    .collection("assessments")
    .where("shareId", "==", shareId)
    .limit(1)
    .get();
  if (parentSnap.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parent = parentSnap.docs[0];
  const p = parent.data();

  // One full assessment per free assessment.
  const existing = await db
    .collection("assessments")
    .where("parentAssessmentId", "==", parent.id)
    .limit(1)
    .get();
  if (!existing.empty) {
    return NextResponse.redirect(
      new URL(`/start/payment/${existing.docs[0].id}`, url.origin),
    );
  }

  const fullRef = db.collection("assessments").doc();
  await fullRef.set({
    id: fullRef.id,
    shareId: nanoid(10),
    schemaVersion: SCHEMA_VERSION,
    tier: "full",
    channel: p.channel ?? null,
    selectedWorkflows: [],
    locale: p.locale ?? { country: null, timezone: null, currency: "USD" },
    parentAssessmentId: parent.id,
    consentIds: p.consentIds ?? [],

    firstName: p.firstName ?? null,
    businessName: p.businessName ?? null,
    website: p.website ?? null,
    location: p.location ?? null,
    teamSize: p.teamSize ?? null,
    clientName: p.clientName ?? null,
    clientEmail: p.clientEmail ?? null,
    industry: p.industry ?? "real_estate",
    callerRole: null,
    phone: p.phone ?? null,

    status: "awaiting_payment",
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
    twilioCallSid: null,
  });

  // Carry the free observation forward so nothing is asked twice (FR: no
  // repeated questions unless confirmation is required).
  const obs = await parent.ref.collection("observations").get();
  for (const doc of obs.docs) {
    await fullRef.collection("observations").add(doc.data());
  }

  void logEvent("full_assessment_checkout_started", { assessmentId: fullRef.id });
  return NextResponse.redirect(new URL(`/start/payment/${fullRef.id}`, url.origin));
}
