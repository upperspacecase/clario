import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { signVoiceSessionToken } from "@/lib/voice-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WS_BASE_URL = "wss://voice-agent-ws.fly.dev/";

const ALLOWED_VOICES = new Set(["Aoede", "Puck", "Charon", "Kore", "Fenrir"]);

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { voice?: unknown };
    const requestedVoice =
      typeof body.voice === "string" && ALLOWED_VOICES.has(body.voice)
        ? body.voice
        : undefined;

    const shareId = nanoid(10);
    const docRef = adminDb().collection("assessments").doc();
    const assessmentId = docRef.id;

    await docRef.set({
      id: assessmentId,
      shareId,

      firstName: null,
      businessName: null,
      website: null,
      location: null,
      teamSize: null,

      clientName: null,
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

    const voiceSessionToken = await signVoiceSessionToken(assessmentId, shareId, requestedVoice);
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
