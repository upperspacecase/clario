import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export const SYDNEY_TZ = "Australia/Sydney";
export const SLOT_MINUTES = 30;

export type BookingStatus = "open" | "booked" | "blocked";

export interface BookerInfo {
  name: string;
  email: string;
  assessmentId: string;
  shareId: string;
  notes?: string;
}

export interface BookingSlot {
  id: string;
  start: Timestamp;
  end: Timestamp;
  status: BookingStatus;
  bookedBy?: BookerInfo;
  bookedAt?: Timestamp;
  createdAt: Timestamp;
}

function rowToSlot(id: string, data: FirebaseFirestore.DocumentData): BookingSlot {
  const out: BookingSlot = {
    id,
    start: data.start as Timestamp,
    end: data.end as Timestamp,
    status: data.status as BookingStatus,
    createdAt: data.createdAt as Timestamp,
  };
  if (data.bookedBy) out.bookedBy = data.bookedBy as BookerInfo;
  if (data.bookedAt) out.bookedAt = data.bookedAt as Timestamp;
  return out;
}

export async function listOpenSlotsInRange(
  startTs: Timestamp,
  endTs: Timestamp,
): Promise<BookingSlot[]> {
  const snap = await adminDb()
    .collection("bookingSlots")
    .where("status", "==", "open")
    .where("start", ">=", startTs)
    .where("start", "<", endTs)
    .orderBy("start", "asc")
    .get();
  return snap.docs.map((d) => rowToSlot(d.id, d.data()));
}

export async function listSlotsInRange(
  startTs: Timestamp,
  endTs: Timestamp,
): Promise<BookingSlot[]> {
  const snap = await adminDb()
    .collection("bookingSlots")
    .where("start", ">=", startTs)
    .where("start", "<", endTs)
    .orderBy("start", "asc")
    .get();
  return snap.docs.map((d) => rowToSlot(d.id, d.data()));
}

export async function listBookings(args: {
  from: Timestamp;
  to: Timestamp;
}): Promise<BookingSlot[]> {
  const snap = await adminDb()
    .collection("bookingSlots")
    .where("status", "==", "booked")
    .where("start", ">=", args.from)
    .where("start", "<", args.to)
    .orderBy("start", "asc")
    .get();
  return snap.docs.map((d) => rowToSlot(d.id, d.data()));
}

export type BookResult =
  | { ok: true; slot: BookingSlot }
  | { ok: false; reason: "already_booked" | "not_found" | "not_open" };

export async function bookSlot(args: {
  slotId: string;
  bookerInfo: BookerInfo;
}): Promise<BookResult> {
  const ref = adminDb().collection("bookingSlots").doc(args.slotId);
  try {
    const result = await adminDb().runTransaction<BookResult>(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { ok: false, reason: "not_found" };
      const data = snap.data()!;
      const status = data.status as BookingStatus;
      if (status === "booked") return { ok: false, reason: "already_booked" };
      if (status !== "open") return { ok: false, reason: "not_open" };

      const bookedBy: BookerInfo = {
        name: args.bookerInfo.name,
        email: args.bookerInfo.email,
        assessmentId: args.bookerInfo.assessmentId,
        shareId: args.bookerInfo.shareId,
      };
      if (args.bookerInfo.notes && args.bookerInfo.notes.trim()) {
        bookedBy.notes = args.bookerInfo.notes.trim();
      }

      tx.update(ref, {
        status: "booked",
        bookedBy,
        bookedAt: FieldValue.serverTimestamp(),
      });

      return {
        ok: true,
        slot: {
          id: args.slotId,
          start: data.start as Timestamp,
          end: data.end as Timestamp,
          status: "booked",
          bookedBy,
          createdAt: data.createdAt as Timestamp,
        },
      };
    });
    return result;
  } catch (err) {
    console.error("[bookings] bookSlot transaction failed:", err);
    return { ok: false, reason: "not_found" };
  }
}

export async function setSlotStatus(args: {
  slotId: string;
  status: "open" | "blocked";
}): Promise<void> {
  await adminDb().collection("bookingSlots").doc(args.slotId).update({
    status: args.status,
  });
}

export async function cancelBooking(slotId: string): Promise<BookerInfo | null> {
  const ref = adminDb().collection("bookingSlots").doc(slotId);
  return adminDb().runTransaction<BookerInfo | null>(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const data = snap.data()!;
    if (data.status !== "booked") return null;
    const prevBooker = (data.bookedBy as BookerInfo) ?? null;
    tx.update(ref, {
      status: "open",
      bookedBy: FieldValue.delete(),
      bookedAt: FieldValue.delete(),
    });
    return prevBooker;
  });
}

export async function createSlotIfMissing(args: {
  start: Date;
}): Promise<{ id: string; created: boolean }> {
  const startTs = Timestamp.fromDate(args.start);
  const endTs = Timestamp.fromMillis(startTs.toMillis() + SLOT_MINUTES * 60 * 1000);

  const existing = await adminDb()
    .collection("bookingSlots")
    .where("start", "==", startTs)
    .limit(1)
    .get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    if (doc.data().status === "blocked") {
      await doc.ref.update({ status: "open" });
    }
    return { id: doc.id, created: false };
  }

  const ref = await adminDb().collection("bookingSlots").add({
    start: startTs,
    end: endTs,
    status: "open" as BookingStatus,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id, created: true };
}

// Returns 30-minute slot start times (in UTC) for the given Sydney-local date,
// from `startHour` (inclusive) to `endHour` (exclusive). Skips weekends if
// `weekdaysOnly`.
export function sydneySlotsForDate(args: {
  date: Date; // any moment within the target Sydney calendar day
  startHour: number;
  endHour: number;
}): Date[] {
  const { date, startHour, endHour } = args;
  const slots: Date[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (const m of [0, 30]) {
      slots.push(sydneyDateToUtc(date, h, m));
    }
  }
  return slots;
}

// Convert (sydney-local-date, hour, minute) to a UTC Date.
// Uses Intl to compute Sydney's UTC offset for that specific instant
// (handles AEDT/AEST DST without a library).
export function sydneyDateToUtc(date: Date, hour: number, minute: number): Date {
  const ymd = sydneyYMD(date);
  // Build a UTC timestamp first as if Sydney were UTC, then subtract Sydney's
  // offset at that moment.
  const naiveUtc = Date.UTC(ymd.year, ymd.month - 1, ymd.day, hour, minute, 0);
  const offsetMin = sydneyOffsetMinutes(new Date(naiveUtc));
  return new Date(naiveUtc - offsetMin * 60 * 1000);
}

export function sydneyYMD(date: Date): {
  year: number;
  month: number;
  day: number;
  weekday: number; // 0=Sun..6=Sat
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: SYDNEY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    weekday: weekdayMap[map.weekday] ?? 0,
  };
}

function sydneyOffsetMinutes(at: Date): number {
  // Computes Sydney's offset from UTC at `at` in minutes. Positive = ahead of UTC.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: SYDNEY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(at);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const sydAsUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return Math.round((sydAsUtc - at.getTime()) / 60000);
}

export function formatSydney(at: Date | Timestamp, opts?: Intl.DateTimeFormatOptions): string {
  const d = at instanceof Timestamp ? at.toDate() : at;
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...opts,
  }).format(d);
}

export function formatSydneyTime(at: Date | Timestamp): string {
  const d = at instanceof Timestamp ? at.toDate() : at;
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatSydneyDay(at: Date | Timestamp): string {
  const d = at instanceof Timestamp ? at.toDate() : at;
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export function sydneyDayKey(at: Date | Timestamp): string {
  const d = at instanceof Timestamp ? at.toDate() : at;
  const ymd = sydneyYMD(d);
  return `${ymd.year}-${String(ymd.month).padStart(2, "0")}-${String(ymd.day).padStart(2, "0")}`;
}
