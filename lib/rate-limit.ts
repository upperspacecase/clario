// Every /api/voice/call request dials a real phone on our account, so this
// fails closed: any error checking the limit rejects the call rather than
// letting it through.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

const PER_IP_PER_DAY = 3;
const PER_NUMBER_PER_DAY = 2;
const GLOBAL_PER_DAY = 50;

// Fixed UTC day buckets. Coarser than a sliding window, but a caller who waits
// out a day-boundary reset is not the abuse case we care about.
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export type RateLimitVerdict =
  | { allowed: true }
  | { allowed: false; reason: "ip" | "number" | "global" | "unavailable" };

export async function checkAndRecordCall(
  ip: string,
  phoneE164: string,
): Promise<RateLimitVerdict> {
  const day = today();
  const db = adminDb();
  const counters = [
    { ref: db.collection("rateLimits").doc(`ip_${ip}_${day}`), cap: PER_IP_PER_DAY, reason: "ip" as const },
    { ref: db.collection("rateLimits").doc(`num_${phoneE164}_${day}`), cap: PER_NUMBER_PER_DAY, reason: "number" as const },
    { ref: db.collection("rateLimits").doc(`global_${day}`), cap: GLOBAL_PER_DAY, reason: "global" as const },
  ];

  try {
    return await db.runTransaction(async (tx) => {
      const snaps = await Promise.all(counters.map((c) => tx.get(c.ref)));

      for (let i = 0; i < counters.length; i++) {
        const count = (snaps[i].data()?.count as number | undefined) ?? 0;
        if (count >= counters[i].cap) {
          return { allowed: false, reason: counters[i].reason };
        }
      }

      // Only increment once every cap has passed, so a rejected request does
      // not burn quota on the counters it did clear.
      for (const c of counters) {
        tx.set(
          c.ref,
          { count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }
      return { allowed: true };
    });
  } catch (e) {
    console.error("[rate-limit] check failed, refusing call:", e);
    return { allowed: false, reason: "unavailable" };
  }
}
