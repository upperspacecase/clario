import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { verifyVoiceSessionToken } from "@/lib/voice-token";
import { sendAdminNotification, sendCallConfirmation } from "@/lib/email";
import type { AssessmentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPastInCall(status: AssessmentStatus | undefined): boolean {
  if (!status) return false;
  return status !== "in_call";
}

function isMissing(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

export async function POST(req: Request) {
  let body: { assessmentId?: string; voiceSessionToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { assessmentId, voiceSessionToken } = body;
  if (!assessmentId || !voiceSessionToken) {
    return NextResponse.json(
      { error: "assessmentId and voiceSessionToken are required" },
      { status: 400 },
    );
  }

  let payload;
  try {
    payload = await verifyVoiceSessionToken(voiceSessionToken);
  } catch {
    return NextResponse.json({ error: "Invalid voice session token" }, { status: 401 });
  }

  if (payload.assessmentId !== assessmentId) {
    return NextResponse.json({ error: "Token does not match assessment" }, { status: 401 });
  }

  try {
    const docRef = adminDb().collection("assessments").doc(assessmentId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const data = snap.data() as Record<string, unknown>;
    const currentStatus = data.status as AssessmentStatus | undefined;

    const clientName = (data.clientName as string | null) ?? null;
    const clientEmail = (data.clientEmail as string | null) ?? null;
    const businessName = (data.businessName as string | null) ?? null;
    const industry = (data.industry as string | null) ?? null;
    const callerRole = (data.callerRole as string | null) ?? null;
    const shareId = (data.shareId as string) ?? "";

    const needsConfirmation =
      isMissing(clientName) ||
      isMissing(clientEmail) ||
      isMissing(businessName) ||
      isMissing(industry) ||
      isMissing(callerRole);

    if (isPastInCall(currentStatus)) {
      return NextResponse.json({
        ok: true,
        status: currentStatus,
        needsConfirmation,
      });
    }

    await docRef.update({
      status: "pending_processing" satisfies AssessmentStatus,
    });

    const updates: Record<string, unknown> = {};

    if (clientEmail && EMAIL_REGEX.test(clientEmail)) {
      await sendCallConfirmation({
        to: clientEmail,
        clientName: clientName ?? "",
      });
      updates.confirmationEmailedAt = FieldValue.serverTimestamp();
    }

    await sendAdminNotification({
      businessName: businessName ?? "Unknown business",
      assessmentId,
      shareId,
    });

    if (Object.keys(updates).length > 0) {
      await docRef.update(updates);
    }

    return NextResponse.json({
      ok: true,
      status: "pending_processing" as AssessmentStatus,
      needsConfirmation,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
