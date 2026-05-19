"use server";

import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebase-admin";
import { isAdminEmail } from "@/lib/admin-emails";
import {
  createSlotIfMissing,
  setSlotStatus,
  sydneyDateToUtc,
  sydneyYMD,
} from "@/lib/bookings";

async function requireAdmin(idToken: string): Promise<void> {
  const decoded = await adminAuth().verifyIdToken(idToken);
  if (!isAdminEmail(decoded.email) || !decoded.email_verified) {
    throw new Error("Forbidden");
  }
}

export async function toggleSlotAction(args: {
  idToken: string;
  slotId?: string | null;
  startMs?: number; // for slots that don't exist yet
  desiredStatus: "open" | "blocked";
}): Promise<{ ok: true; slotId: string }> {
  await requireAdmin(args.idToken);

  let id = args.slotId ?? null;
  if (!id) {
    if (typeof args.startMs !== "number") {
      throw new Error("startMs required when slotId missing");
    }
    const created = await createSlotIfMissing({ start: new Date(args.startMs) });
    id = created.id;
  }

  await setSlotStatus({ slotId: id, status: args.desiredStatus });
  revalidatePath("/admin/availability");
  return { ok: true, slotId: id };
}

export async function bulkOpenWeekdaysAction(args: {
  idToken: string;
  weeks: number; // e.g. 4
  startHour: number; // sydney local, e.g. 10
  endHour: number; // exclusive, e.g. 14
}): Promise<{ ok: true; createdCount: number; touchedCount: number }> {
  await requireAdmin(args.idToken);
  const { weeks, startHour, endHour } = args;

  let createdCount = 0;
  let touchedCount = 0;

  const now = new Date();
  for (let dayOffset = 0; dayOffset < weeks * 7; dayOffset++) {
    // Walk forward by adding 24h then asking for that day's Sydney YMD.
    const probe = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const ymd = sydneyYMD(probe);
    if (ymd.weekday === 0 || ymd.weekday === 6) continue; // weekend

    for (let h = startHour; h < endHour; h++) {
      for (const m of [0, 30]) {
        const startUtc = sydneyDateToUtc(probe, h, m);
        if (startUtc.getTime() <= Date.now()) continue;
        const r = await createSlotIfMissing({ start: startUtc });
        touchedCount++;
        if (r.created) createdCount++;
      }
    }
  }

  revalidatePath("/admin/availability");
  return { ok: true, createdCount, touchedCount };
}

export async function fetchSlotsAction(args: {
  idToken: string;
  fromMs: number;
  toMs: number;
}): Promise<
  Array<{
    id: string;
    startMs: number;
    endMs: number;
    status: "open" | "booked" | "blocked";
    bookedByName?: string;
  }>
> {
  await requireAdmin(args.idToken);
  const { listSlotsInRange } = await import("@/lib/bookings");
  const slots = await listSlotsInRange(
    Timestamp.fromMillis(args.fromMs),
    Timestamp.fromMillis(args.toMs),
  );
  return slots.map((s) => ({
    id: s.id,
    startMs: s.start.toMillis(),
    endMs: s.end.toMillis(),
    status: s.status,
    bookedByName: s.bookedBy?.name,
  }));
}
