// Seed `config/global` with the defaults sub-skill 08 needs (notably
// bookingUrlBase, which it fails closed on if missing). Idempotent: re-running
// merges, so safe to run repeatedly. Run with: npx tsx scripts/seed-config.ts

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config as loadDotenv } from "dotenv";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: join(REPO_ROOT, ".env.local"), quiet: true });
loadDotenv({ path: join(REPO_ROOT, ".env"), quiet: true });

import { adminDb } from "../lib/firebase-admin.js";
import { FieldValue } from "firebase-admin/firestore";

async function main() {
  const defaults = {
    assessmentPriceUsd: 1000,
    freePilotMode: false,
    maxCallDurationSec: 2400,
    bookingUrlBase: "https://gethours.org/r",
    notificationEmail: "tay@life-time.co",
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = adminDb().collection("config").doc("global");
  await ref.set(defaults, { merge: true });
  console.log("[seed-config] merged into config/global:", {
    ...defaults,
    updatedAt: "<serverTimestamp>",
  });
}

main().catch((e) => {
  console.error("[seed-config] failed:", e instanceof Error ? e.stack : e);
  process.exit(1);
});
