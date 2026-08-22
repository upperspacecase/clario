// Analytics events from PRD §14.1. One collection, append-only.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

export type EventName =
  | "assessment_cta_clicked"
  | "intake_channel_selected"
  | "workflow_selected"
  | "intake_started"
  | "intake_completed"
  | "intake_abandoned"
  | "report_generated"
  | "report_approved"
  | "report_delivered"
  | "report_opened"
  | "full_assessment_checkout_started"
  | "full_assessment_paid"
  | "full_assessment_refunded"
  | "strategy_call_booked"
  | "strategy_call_completed"
  | "recommendation_accepted"
  | "recommendation_rejected";

export async function logEvent(
  name: EventName,
  data: {
    assessmentId?: string;
    channel?: "form" | "phone";
    meta?: Record<string, string | number | boolean | null>;
  } = {},
): Promise<void> {
  try {
    await adminDb().collection("events").add({
      name,
      assessmentId: data.assessmentId ?? null,
      channel: data.channel ?? null,
      meta: data.meta ?? {},
      at: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    // Analytics must never break a customer path.
    console.error(`[events] failed to log ${name}:`, e);
  }
}
