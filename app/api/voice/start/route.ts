import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { signVoiceSessionToken } from "@/lib/voice-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WS_BASE_URL = "wss://voice-agent-ws.fly.dev/";

const MAX_NAME_LEN = 80;

function sanitizeShortString(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, MAX_NAME_LEN);
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const firstName = sanitizeShortString(body?.firstName);
    const businessName = sanitizeShortString(body?.businessName);

    const shareId = nanoid(10);
    const docRef = adminDb().collection("assessments").doc();
    const assessmentId = docRef.id;

    await docRef.set({
      id: assessmentId,
      shareId,

      firstName,
      businessName,
      website: null,
      location: null,
      teamSize: null,

      clientName: firstName,
      clientEmail: null,
      industry: null,
      callerRole: null,

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
    });

    const voiceSessionToken = await signVoiceSessionToken(assessmentId, shareId);
    const wsUrl = `${WS_BASE_URL}?token=${encodeURIComponent(voiceSessionToken)}`;

    return NextResponse.json({
      assessmentId,
      shareId,
      voiceSessionToken,
      wsUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
