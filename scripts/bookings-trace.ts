// One-off: run the same Firestore query the /api/bookings/book route runs.
// Bypasses Vercel entirely to surface the underlying error (missing index,
// permission, empty collection, etc.).

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config as loadDotenv } from "dotenv";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: join(REPO_ROOT, ".env.local"), quiet: true });
loadDotenv({ path: join(REPO_ROOT, ".env"), quiet: true });

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../lib/firebase-admin.js";
import { listOpenSlotsInRange } from "../lib/bookings.js";

async function main() {
  // First: a raw count to confirm the collection exists and has docs at all.
  const allSnap = await adminDb()
    .collection("bookingSlots")
    .limit(50)
    .get();
  console.log(`bookingSlots total (first 50): ${allSnap.size}`);
  if (allSnap.size > 0) {
    for (const d of allSnap.docs.slice(0, 5)) {
      const data = d.data();
      const start = data.start?.toDate?.()?.toISOString?.() ?? "?";
      console.log(`  ${d.id}  status=${data.status}  start=${start}`);
    }
  }

  console.log();
  const fromMs = Date.now() + 60 * 60 * 1000;
  const toMs = fromMs + 7 * 24 * 60 * 60 * 1000;
  console.log(
    `Running listOpenSlotsInRange from=${new Date(fromMs).toISOString()} to=${new Date(toMs).toISOString()}`,
  );
  try {
    const slots = await listOpenSlotsInRange(
      Timestamp.fromMillis(fromMs),
      Timestamp.fromMillis(toMs),
    );
    console.log(`got ${slots.length} open slots`);
    for (const s of slots.slice(0, 5)) {
      console.log(`  ${s.id}  start=${s.start.toDate().toISOString()}  status=${s.status}`);
    }
  } catch (e) {
    console.error("query threw:");
    console.error(e instanceof Error ? e.message : String(e));
    if (e instanceof Error && e.stack) console.error(e.stack);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack : e);
  process.exit(1);
});
