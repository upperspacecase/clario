// Job worker. Runs inside the Fly process next to the WS relay (started from
// live.ts) or standalone via worker-main.ts for local runs.

import { claimNextJob, completeJob, failJob } from "../lib/jobs.js";
import { generateFreeReport } from "../lib/engine.js";
import { extractObservations } from "../lib/extract.js";
import { extractFullObservations } from "../lib/extract-full.js";
import { generateFullReport } from "../lib/engine-full.js";

const POLL_MS = 5_000;

async function handle(jobId: string, type: string, assessmentId: string): Promise<void> {
  if (type === "generate_free_report") return generateFreeReport(assessmentId);
  if (type === "extract_observations") return extractObservations(assessmentId);
  if (type === "extract_full_observations") return extractFullObservations(assessmentId);
  if (type === "generate_full_report") return generateFullReport(assessmentId);
  throw new Error(`unknown job type ${type}`);
}

export function startWorker(): void {
  let stopped = false;
  const loop = async () => {
    while (!stopped) {
      try {
        const claimed = await claimNextJob();
        if (!claimed) {
          await new Promise((r) => setTimeout(r, POLL_MS));
          continue;
        }
        const { id, job } = claimed;
        console.log(`[WORKER] start job=${id} attempt=${job.attempts}`);
        try {
          await handle(id, job.type, job.assessmentId);
          await completeJob(id);
          console.log(`[WORKER] done job=${id}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[WORKER] failed job=${id}:`, msg);
          await failJob(id, msg);
        }
      } catch (e) {
        console.error("[WORKER] loop error:", e);
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    }
  };
  void loop();
  console.log("[WORKER] started");
  process.on("SIGTERM", () => {
    stopped = true;
  });
}
