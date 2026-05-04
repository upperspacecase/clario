"use server";

import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cancelBooking, listBookings } from "@/lib/bookings";
import { sendBookingCancellation } from "@/lib/email";

const ALLOWED_EMAIL = "tay@life-time.co";

async function requireAdmin(idToken: string): Promise<void> {
  const decoded = await adminAuth().verifyIdToken(idToken);
  if (decoded.email !== ALLOWED_EMAIL || !decoded.email_verified) {
    throw new Error("Forbidden");
  }
}

export type AdminBookingRow = {
  slotId: string;
  startMs: number;
  endMs: number;
  clientName: string;
  clientEmail: string;
  notes?: string;
  assessmentId: string;
  shareId: string;
  businessName: string | null;
};

export async function fetchUpcomingBookingsAction(args: {
  idToken: string;
}): Promise<AdminBookingRow[]> {
  await requireAdmin(args.idToken);
  const now = Timestamp.now();
  const horizon = Timestamp.fromMillis(now.toMillis() + 90 * 24 * 60 * 60 * 1000);
  const slots = await listBookings({ from: now, to: horizon });

  // Pull business names from assessments collection in one batch.
  const businessNames = new Map<string, string | null>();
  const assessmentIds = Array.from(
    new Set(slots.map((s) => s.bookedBy?.assessmentId).filter((x): x is string => !!x)),
  );
  if (assessmentIds.length) {
    const refs = assessmentIds.map((id) => adminDb().collection("assessments").doc(id));
    const docs = await adminDb().getAll(...refs);
    for (const doc of docs) {
      const data = doc.data();
      businessNames.set(doc.id, (data?.businessName as string | null) ?? null);
    }
  }

  return slots
    .filter((s) => !!s.bookedBy)
    .map((s) => ({
      slotId: s.id,
      startMs: s.start.toMillis(),
      endMs: s.end.toMillis(),
      clientName: s.bookedBy!.name,
      clientEmail: s.bookedBy!.email,
      notes: s.bookedBy!.notes,
      assessmentId: s.bookedBy!.assessmentId,
      shareId: s.bookedBy!.shareId,
      businessName: businessNames.get(s.bookedBy!.assessmentId) ?? null,
    }));
}

export async function cancelBookingAction(args: {
  idToken: string;
  slotId: string;
}): Promise<{ ok: true }> {
  await requireAdmin(args.idToken);
  const slotDoc = await adminDb().collection("bookingSlots").doc(args.slotId).get();
  const startTs = slotDoc.data()?.start as Timestamp | undefined;
  const prevBooker = await cancelBooking(args.slotId);
  if (prevBooker && startTs) {
    await sendBookingCancellation({
      to: prevBooker.email,
      clientName: prevBooker.name,
      start: startTs.toDate(),
    });
  }
  revalidatePath("/admin/bookings");
  return { ok: true };
}
