import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isAdminEmail } from "@/lib/admin-emails";
import { sendReportReady } from "@/lib/email";
import type { AssessmentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(m[1]);
    if (!isAdminEmail(decoded.email) || !decoded.email_verified) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const uid = await requireAdmin(req);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { assessmentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { assessmentId } = body;
  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
  }

  try {
    const docRef = adminDb().collection("assessments").doc(assessmentId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const data = snap.data() as Record<string, unknown>;
    const status = data.status as AssessmentStatus | undefined;
    const shareId = (data.shareId as string | undefined) ?? "";
    const clientEmail = (data.clientEmail as string | undefined) ?? "";
    const clientName = (data.clientName as string | undefined) ?? "";

    if (!shareId) {
      return NextResponse.json({ error: "Assessment has no shareId" }, { status: 422 });
    }
    if (status !== "manual_review" && status !== "complete") {
      return NextResponse.json(
        { error: `Cannot send: status is ${status}` },
        { status: 422 },
      );
    }
    if (!clientEmail || !EMAIL_REGEX.test(clientEmail)) {
      return NextResponse.json({ error: "Missing or invalid clientEmail" }, { status: 422 });
    }

    const publicSnap = await adminDb().collection("publicReports").doc(shareId).get();
    if (!publicSnap.exists) {
      return NextResponse.json({ error: "publicReport missing — run the pipeline" }, { status: 422 });
    }

    await sendReportReady({ to: clientEmail, clientName, shareId });

    await docRef.update({
      status: "complete" satisfies AssessmentStatus,
      emailedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, shareId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
