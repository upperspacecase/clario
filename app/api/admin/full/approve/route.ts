// QC gate for Full Assessments (FR-43, FR-39). Approving delivers the report;
// a report below the $10k guarantee threshold triggers the refund FIRST and
// still delivers — the estimate is never touched to dodge a refund.

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin, AdminAuthError } from "@/lib/admin-auth";
import { getStripe } from "@/lib/stripe";
import { logEvent } from "@/lib/events";
import { sendReportReady } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    const status = e instanceof AdminAuthError ? e.status : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const body = await req.json().catch(() => ({}));
  const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId : "";
  if (!assessmentId) return NextResponse.json({ error: "assessmentId required" }, { status: 400 });

  const db = adminDb();
  const ref = db.collection("assessments").doc(assessmentId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const a = snap.data() as Record<string, unknown>;
  if (a.tier !== "full") return NextResponse.json({ error: "Not a full assessment" }, { status: 400 });

  const shareId = a.shareId as string;
  const reportRef = db.collection("publicReports").doc(shareId);
  const report = (await reportRef.get()).data();
  if (!report || report.kind !== "full_v1") {
    return NextResponse.json({ error: "No full report to approve" }, { status: 409 });
  }
  if (report.approved === true) {
    return NextResponse.json({ ok: true, alreadyApproved: true });
  }

  // Guarantee check before anything customer-facing happens.
  let refunded = false;
  if (report.guaranteeMet === false) {
    const pi = a.stripePaymentIntentId as string | null;
    if (pi) {
      try {
        await getStripe().refunds.create({ payment_intent: pi });
        refunded = true;
      } catch (e) {
        console.error("[full/approve] refund failed:", e);
        return NextResponse.json(
          { error: "Refund failed — resolve in Stripe before approving" },
          { status: 502 },
        );
      }
    }
    await ref.update({
      guaranteeOutcome: "refunded",
      refundReason: "below_10k_guarantee",
      refundedOpportunityUsd: report.guaranteeTotalUsd ?? 0,
    });
    await logEvent("full_assessment_refunded", {
      assessmentId,
      meta: { guaranteeTotalUsd: (report.guaranteeTotalUsd as number) ?? 0 },
    });
  }

  await reportRef.update({ approved: true, approvedAt: FieldValue.serverTimestamp() });
  await ref.update({ status: "complete", completedAt: FieldValue.serverTimestamp() });
  await logEvent("report_approved", { assessmentId, meta: { kind: "full_v1", refunded } });

  const email = a.clientEmail as string | null;
  if (email) {
    await sendReportReady({
      to: email,
      clientName: (a.clientName as string | null) ?? "",
      shareId,
    });
    await ref.update({ emailedAt: FieldValue.serverTimestamp() });
    await logEvent("report_delivered", { assessmentId, meta: { kind: "full_v1" } });
  }

  return NextResponse.json({ ok: true, refunded });
}
