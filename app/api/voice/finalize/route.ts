import { NextResponse } from "next/server";
import { verifyVoiceSessionToken } from "@/lib/voice-token";
import { finalizeAssessment } from "@/lib/finalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const result = await finalizeAssessment(assessmentId);
    if (!result.ok) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      status: result.status,
      needsConfirmation: result.needsConfirmation,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
