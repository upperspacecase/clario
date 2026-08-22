// Places the paid 45-minute Full Assessment call. Gated on payment; the
// shareId is the unguessable capability, same as the report page.

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import twilio from "twilio";
import { adminDb } from "@/lib/firebase-admin";
import { signVoiceSessionToken } from "@/lib/voice-token";
import { logEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WS_MEDIA_URL = process.env.WS_MEDIA_URL ?? "wss://voice-agent-ws.fly.dev/media";
const CALL_TIME_LIMIT_SEC = 90 * 60;
const E164 = /^\+[1-9]\d{7,14}$/;

const CONSENT_VERSION = "ai_call_full_v1";
const CONSENT_TEXT =
  "By tapping Call me now you request a phone call from Sam, an AI interviewer, and agree to transcription of the call so Hours can prepare your report.";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return NextResponse.json({ error: "Calling is not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const shareId = typeof body?.shareId === "string" ? body.shareId.trim() : "";
  if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });

  const snap = await adminDb()
    .collection("assessments")
    .where("shareId", "==", shareId)
    .limit(1)
    .get();
  if (snap.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const docRef = snap.docs[0].ref;
  const a = snap.docs[0].data();

  if (a.tier !== "full") return NextResponse.json({ error: "Not a full assessment" }, { status: 400 });
  if (!a.paidAt) return NextResponse.json({ error: "Payment required first" }, { status: 402 });
  if (a.status === "pending_processing" || a.status === "processing" || a.status === "complete") {
    return NextResponse.json({ error: "This assessment call is already done" }, { status: 409 });
  }

  const bodyPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const phone = (a.phone as string | null) ?? bodyPhone;
  if (!E164.test(phone)) {
    return NextResponse.json(
      { error: "Enter a valid phone number including country code" },
      { status: 400 },
    );
  }

  const consentRef = adminDb().collection("consents").doc();
  await consentRef.set({
    assessmentId: docRef.id,
    channel: "phone",
    kind: "ai_call",
    textVersion: CONSENT_VERSION,
    text: CONSENT_TEXT,
    grantedAt: FieldValue.serverTimestamp(),
    ip: (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim(),
    userAgent: req.headers.get("user-agent"),
  });
  await docRef.update({
    phone,
    channel: "phone",
    consentIds: FieldValue.arrayUnion(consentRef.id),
    status: "in_call",
  });

  const token = await signVoiceSessionToken(docRef.id, shareId);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="${escapeXml(WS_MEDIA_URL)}"><Parameter name="token" value="${escapeXml(token)}"/></Stream></Connect></Response>`;

  try {
    const call = await twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN).calls.create({
      to: phone,
      from: TWILIO_FROM_NUMBER,
      twiml,
      timeLimit: CALL_TIME_LIMIT_SEC,
    });
    await docRef.update({ twilioCallSid: call.sid });
    void logEvent("intake_started", { assessmentId: docRef.id, channel: "phone", meta: { tier: "full" } });
    return NextResponse.json({ ok: true, callSid: call.sid });
  } catch (err) {
    await docRef.update({ status: "awaiting_details" }).catch(() => undefined);
    console.error("[full/call] twilio create failed:", err);
    return NextResponse.json({ error: "Could not place the call" }, { status: 502 });
  }
}
