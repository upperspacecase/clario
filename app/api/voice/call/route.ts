import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import twilio from "twilio";
import { adminDb } from "@/lib/firebase-admin";
import { signVoiceSessionToken } from "@/lib/voice-token";
import { checkAndRecordCall } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Override for tunnel testing; production is the Fly app.
const WS_MEDIA_URL = process.env.WS_MEDIA_URL ?? "wss://voice-agent-ws.fly.dev/media";

// Cost backstop. Calls target ~45 min and may run to 60; past this something
// has gone wrong and we stop paying for it.
const CALL_TIME_LIMIT_SEC = 70 * 60;

const MAX_NAME_LEN = 80;
const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, MAX_NAME_LEN);
  return trimmed.length > 0 ? trimmed : null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
  } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return NextResponse.json({ error: "Calling is not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));

  const firstName = sanitize(body?.firstName);
  const businessName = sanitize(body?.businessName);
  const website = sanitize(body?.website);
  const email = sanitize(body?.email);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!firstName || !businessName || !email) {
    return NextResponse.json(
      { error: "firstName, businessName and email are required" },
      { status: 400 },
    );
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (!E164.test(phone)) {
    return NextResponse.json(
      { error: "Enter a valid phone number including country code" },
      { status: 400 },
    );
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const verdict = await checkAndRecordCall(ip, phone);
  if (!verdict.allowed) {
    const status = verdict.reason === "unavailable" ? 503 : 429;
    return NextResponse.json(
      { error: "Too many call requests. Try again later.", reason: verdict.reason },
      { status },
    );
  }

  const shareId = nanoid(10);
  const docRef = adminDb().collection("assessments").doc();
  const assessmentId = docRef.id;

  await docRef.set({
    id: assessmentId,
    shareId,

    firstName,
    businessName,
    website,
    location: null,
    teamSize: null,

    clientName: firstName,
    clientEmail: email,
    industry: null,
    callerRole: null,
    phone,

    status: "in_call",
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

  const voiceSessionToken = await signVoiceSessionToken(assessmentId, shareId);

  // Inline TwiML avoids a public webhook and its signature validation. Max
  // 4000 chars; this is well under.
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="${escapeXml(WS_MEDIA_URL)}"><Parameter name="token" value="${escapeXml(voiceSessionToken)}"/></Stream></Connect></Response>`;

  try {
    const call = await twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN).calls.create({
      to: phone,
      from: TWILIO_FROM_NUMBER,
      twiml,
      timeLimit: CALL_TIME_LIMIT_SEC,
    });
    await docRef.update({ twilioCallSid: call.sid });
    return NextResponse.json({ assessmentId, shareId, callSid: call.sid });
  } catch (err) {
    // The doc would otherwise sit in `in_call` forever with no call attached.
    await docRef.update({ status: "failed" }).catch(() => undefined);
    console.error("[voice/call] twilio create failed:", err);
    return NextResponse.json({ error: "Could not place the call" }, { status: 502 });
  }
}
