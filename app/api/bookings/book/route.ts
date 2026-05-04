import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  bookSlot,
  formatSydneyDay,
  listOpenSlotsInRange,
} from "@/lib/bookings";
import {
  sendBookingAdminNotification,
  sendBookingConfirmation,
} from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? "7"), 1), 30);
  const fromMs = Date.now() + 60 * 60 * 1000; // 1h lead time
  const toMs = fromMs + days * 24 * 60 * 60 * 1000;
  const slots = await listOpenSlotsInRange(
    Timestamp.fromMillis(fromMs),
    Timestamp.fromMillis(toMs),
  );
  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      startMs: s.start.toMillis(),
      endMs: s.end.toMillis(),
    })),
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      slotId?: unknown;
      name?: unknown;
      email?: unknown;
      assessmentId?: unknown;
      shareId?: unknown;
      notes?: unknown;
    };

    const slotId = typeof body.slotId === "string" ? body.slotId : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const assessmentId = typeof body.assessmentId === "string" ? body.assessmentId : "";
    const shareId = typeof body.shareId === "string" ? body.shareId : "";
    const notes = typeof body.notes === "string" ? body.notes : undefined;

    if (!slotId || !name || !email || !shareId) {
      return NextResponse.json(
        { ok: false, reason: "missing_fields" },
        { status: 400 },
      );
    }

    const result = await bookSlot({
      slotId,
      bookerInfo: { name, email, assessmentId, shareId, notes },
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }

    const start = result.slot.start.toDate();
    const end = result.slot.end.toDate();

    // Look up business name for the admin email (best-effort).
    let businessName = "";
    if (assessmentId) {
      try {
        const doc = await adminDb().collection("assessments").doc(assessmentId).get();
        businessName = (doc.data()?.businessName as string | null) ?? "";
      } catch {}
    }

    await Promise.all([
      sendBookingConfirmation({
        to: email,
        clientName: name,
        start,
        end,
        slotId: result.slot.id,
        notes,
      }),
      sendBookingAdminNotification({
        businessName,
        clientName: name,
        clientEmail: email,
        start,
        end,
        assessmentId,
        shareId,
        notes,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      slot: {
        id: result.slot.id,
        startMs: start.getTime(),
        endMs: end.getTime(),
      },
      formattedSydney: formatSydneyDay(start),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: "server_error", error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
