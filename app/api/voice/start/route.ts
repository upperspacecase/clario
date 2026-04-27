import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "@/lib/firebase-admin";
import { signVoiceSessionToken } from "@/lib/voice-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WS_BASE_URL = "wss://voice-agent-ws.fly.dev/";

type StartBody = {
  firstName?: string;
  businessName?: string;
  website?: string;
  location?: string;
  teamSize?: string;
};

function trimOrNull(v: string | undefined): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function normalizeWebsite(v: string | undefined): string | null {
  const t = trimOrNull(v);
  if (!t) return null;
  const candidate = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(candidate);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    let body: StartBody = {};
    try {
      body = (await req.json()) as StartBody;
    } catch {
      // Tolerate empty body for now (legacy clients without form).
    }

    const firstName = trimOrNull(body.firstName);
    const businessName = trimOrNull(body.businessName);
    const location = trimOrNull(body.location);
    const teamSize = trimOrNull(body.teamSize);
    const website =
      typeof body.website === "string" && body.website.trim().length > 0
        ? normalizeWebsite(body.website)
        : null;

    if (
      typeof body.website === "string" &&
      body.website.trim().length > 0 &&
      website === null
    ) {
      return NextResponse.json(
        { error: "Website doesn't look like a valid URL." },
        { status: 400 },
      );
    }

    const required = { firstName, businessName, location, teamSize };
    const missing = Object.entries(required)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    if (firstName!.length < 2 || firstName!.length > 30) {
      return NextResponse.json(
        { error: "First name must be 2–30 characters." },
        { status: 400 },
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
      location,
      teamSize,

      // Mirror to legacy fields so the post-call confirm form prefills.
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
