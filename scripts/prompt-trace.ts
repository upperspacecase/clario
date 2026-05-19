// One-off: trace the active prompt wire-up. Confirms which prompt is
// currently active, lists all saved prompts, and shows the promptUsed
// snapshot on the most recent assessments.

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config as loadDotenv } from "dotenv";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
loadDotenv({ path: join(REPO_ROOT, ".env.local"), quiet: true });
loadDotenv({ path: join(REPO_ROOT, ".env"), quiet: true });

import { adminDb } from "../lib/firebase-admin.js";
import { listPrompts, getActivePromptId, getActivePrompt } from "../lib/prompts.js";

async function main() {
  const activeId = await getActivePromptId();
  const active = await getActivePrompt();
  const all = await listPrompts();

  console.log("=== config/global.activePromptId ===");
  console.log(activeId ?? "(unset)");
  console.log();

  console.log("=== prompts collection ===");
  for (const p of all) {
    const marker = p.id === activeId ? "★ ACTIVE" : "         ";
    console.log(
      `${marker}  ${p.id}  name=${JSON.stringify(p.name)}  voice=${p.voice}  model=${p.model}  prompt_chars=${p.prompt.length}`,
    );
  }
  console.log();

  if (active) {
    console.log("=== active prompt — first 200 chars ===");
    console.log(active.prompt.slice(0, 200).replace(/\s+/g, " "));
    console.log();
  }

  const snap = await adminDb()
    .collection("assessments")
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();
  console.log("=== recent assessments — promptUsed snapshot ===");
  for (const d of snap.docs) {
    const data = d.data();
    const pu = data.promptUsed;
    const status = data.status ?? "-";
    const createdAt = data.createdAt?.toDate?.()?.toISOString?.() ?? "?";
    if (pu && typeof pu === "object") {
      console.log(
        `${d.id}  status=${status}  createdAt=${createdAt}  promptUsed.id=${pu.id}  name=${JSON.stringify(pu.name)}  voice=${pu.voice}`,
      );
    } else {
      console.log(
        `${d.id}  status=${status}  createdAt=${createdAt}  promptUsed=<missing>`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack : e);
  process.exit(1);
});
