import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await adminDb().collection("config").doc("global").get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "config/global missing" }, { status: 500 });
    }
    const data = snap.data() as Record<string, unknown>;
    return NextResponse.json({
      ok: true,
      price: data.assessmentPriceUsd ?? null,
      freePilotMode: data.freePilotMode ?? null,
      maxCallDurationSec: data.maxCallDurationSec ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
