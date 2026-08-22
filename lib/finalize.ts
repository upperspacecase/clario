// Shared by both transports: the browser posts to /api/voice/finalize, but a
// phone call leaves no browser behind, so server/live.ts calls this directly on
// socket close.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { sendAdminNotification, sendCallConfirmation } from "./email";
import { enqueueJob } from "./jobs";
import type { AssessmentStatus } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isMissing(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

export type FinalizeResult =
  | { ok: true; status: AssessmentStatus; needsConfirmation: boolean }
  | { ok: false; reason: "not_found" };

// Idempotent, so a browser finalize racing a socket-close finalize is safe.
export async function finalizeAssessment(
  assessmentId: string,
): Promise<FinalizeResult> {
  const docRef = adminDb().collection("assessments").doc(assessmentId);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, reason: "not_found" };

  const data = snap.data() as Record<string, unknown>;
  const currentStatus = data.status as AssessmentStatus | undefined;

  const clientName = (data.clientName as string | null) ?? null;
  const clientEmail = (data.clientEmail as string | null) ?? null;
  const businessName = (data.businessName as string | null) ?? null;
  const shareId = (data.shareId as string) ?? "";

  // Industry and role are deliberately not required. The /start form collects
  // five fields and Sam surfaces both conversationally; the report pipeline
  // reads them off the transcript.
  const needsConfirmation =
    isMissing(clientName) || isMissing(clientEmail) || isMissing(businessName);

  if (currentStatus && currentStatus !== "in_call") {
    return { ok: true, status: currentStatus, needsConfirmation };
  }

  // PRD phone flow: the workflow was chosen on the form, so the transcript
  // goes straight to extraction and the engine takes it from there. Legacy
  // whole-operation calls keep the awaiting_details path.
  const isPrdFlow =
    data.tier === "free" &&
    Array.isArray(data.selectedWorkflows) &&
    data.selectedWorkflows.length > 0;

  if (isPrdFlow) {
    await docRef.update({
      status: "pending_processing" satisfies AssessmentStatus,
      queuedForProcessingAt: FieldValue.serverTimestamp(),
    });
    await enqueueJob("extract_observations", assessmentId);
    if (clientEmail && EMAIL_REGEX.test(clientEmail)) {
      await sendCallConfirmation({ to: clientEmail, clientName: clientName ?? "" });
      await docRef.update({ confirmationEmailedAt: FieldValue.serverTimestamp() });
    }
    await sendAdminNotification({
      businessName: businessName ?? "Unknown business",
      assessmentId,
      shareId,
    });
    return {
      ok: true,
      status: "pending_processing" as AssessmentStatus,
      needsConfirmation: false,
    };
  }

  await docRef.update({
    status: "awaiting_details" satisfies AssessmentStatus,
  });

  if (clientEmail && EMAIL_REGEX.test(clientEmail)) {
    await sendCallConfirmation({ to: clientEmail, clientName: clientName ?? "" });
    await docRef.update({ confirmationEmailedAt: FieldValue.serverTimestamp() });
  }

  await sendAdminNotification({
    businessName: businessName ?? "Unknown business",
    assessmentId,
    shareId,
  });

  return {
    ok: true,
    status: "awaiting_details" as AssessmentStatus,
    needsConfirmation,
  };
}
