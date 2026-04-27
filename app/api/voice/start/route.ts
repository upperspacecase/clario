import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { signVoiceSessionToken } from "@/lib/voice-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WS_BASE_URL = "wss://voice-agent-ws.fly.dev/";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const clientName = String(body.clientName ?? "").trim();
    const clientEmail = String(body.clientEmail ?? "").trim().toLowerCase();
    const businessName = String(body.businessName ?? "").trim();
    const industry = String(body.industry ?? "").trim();
    const callerRole = String(body.callerRole ?? "").trim();

    const fieldErrors: Record<string, string> = {};
    if (!clientName) fieldErrors.clientName = "Required";
    if (!clientEmail) fieldErrors.clientEmail = "Required";
    else if (!EMAIL_RE.test(clientEmail)) fieldErrors.clientEmail = "Invalid email";
    if (!businessName) fieldErrors.businessName = "Required";
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ error: "validation", fieldErrors }, { status: 400 });
    }

    const shareId = nanoid(10);
    const docRef = adminDb().collection("assessments").doc();
    const assessmentId = docRef.id;

    await docRef.set({
      id: assessmentId,
      shareId,
      clientName,
      clientEmail,
      businessName,
      industry: industry || null,
      callerRole: callerRole || null,
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
