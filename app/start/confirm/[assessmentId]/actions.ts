"use server";

import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { sendCallConfirmation } from "@/lib/email";
import type { AssessmentStatus } from "@/lib/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ConfirmDetailsInput {
  assessmentId: string;
  clientName: string;
  clientEmail: string;
  businessName: string;
  industry: string;
  callerRole: string;
}

export interface ConfirmDetailsResult {
  ok: boolean;
  fieldErrors?: Partial<Record<keyof ConfirmDetailsInput, string>>;
  message?: string;
}

export async function confirmDetails(
  input: ConfirmDetailsInput,
): Promise<ConfirmDetailsResult> {
  const fieldErrors: Partial<Record<keyof ConfirmDetailsInput, string>> = {};

  const clientName = input.clientName?.trim() ?? "";
  const clientEmail = input.clientEmail?.trim() ?? "";
  const businessName = input.businessName?.trim() ?? "";
  const industry = input.industry?.trim() ?? "";
  const callerRole = input.callerRole?.trim() ?? "";

  if (!clientName) fieldErrors.clientName = "Required";
  if (!clientEmail) fieldErrors.clientEmail = "Required";
  else if (!EMAIL_REGEX.test(clientEmail)) fieldErrors.clientEmail = "Enter a valid email";
  if (!businessName) fieldErrors.businessName = "Required";
  if (!industry) fieldErrors.industry = "Pick an industry";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  if (!input.assessmentId) {
    return { ok: false, message: "Missing assessment id" };
  }

  try {
    const docRef = adminDb().collection("assessments").doc(input.assessmentId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return { ok: false, message: "Assessment not found" };
    }

    const data = snap.data() as Record<string, unknown>;
    const currentStatus = data.status as AssessmentStatus | undefined;
    const alreadyEmailed = Boolean(data.confirmationEmailedAt);

    const updates: Record<string, unknown> = {
      clientName,
      clientEmail,
      businessName,
      industry,
      callerRole,
    };

    const shouldSendConfirmation =
      currentStatus === "pending_processing" &&
      !alreadyEmailed &&
      EMAIL_REGEX.test(clientEmail);

    if (shouldSendConfirmation) {
      updates.confirmationEmailedAt = FieldValue.serverTimestamp();
    }

    await docRef.update(updates);

    if (shouldSendConfirmation) {
      await sendCallConfirmation({
        to: clientEmail,
        clientName,
      });
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Could not save details",
    };
  }

  redirect(`/start/confirm/${input.assessmentId}/done`);
}
