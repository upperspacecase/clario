// `assess-cli log-run` — append/update a pipelineRuns/{runId} entry on an
// assessment, so the orchestrator can record run start, success, and failure.
// `running` creates a new run and stores the runId in the latest pointer.
// `success` and `failed` close the most-recent open run for the assessment.

import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { adminDb } from "../lib/firebase-admin.js";

export async function runLogRun(opts: {
  assessmentId: string;
  status: "running" | "success" | "failed";
  error?: string;
  reportPath?: string;
}): Promise<void> {
  const { assessmentId, status, error, reportPath } = opts;
  const db = adminDb();
  const assessmentRef = db.collection("assessments").doc(assessmentId);
  const runsCol = assessmentRef.collection("pipelineRuns");

  if (status === "running") {
    const runId = nanoid(12);
    await runsCol.doc(runId).set({
      runId,
      startedAt: FieldValue.serverTimestamp(),
      completedAt: null,
      status: "running",
      triggeredBy: "cli",
      skillOutputs: {},
    });
    await assessmentRef.update({ latestPipelineRunId: runId });
    console.log(`[assess-cli log-run] id=${assessmentId} runId=${runId} status=running`);
    return;
  }

  // Closing an existing run: prefer latestPipelineRunId; fall back to most-recent
  // running doc by startedAt.
  const snap = await assessmentRef.get();
  const latest = (snap.data() as { latestPipelineRunId?: string } | undefined)
    ?.latestPipelineRunId;

  let runRef = latest ? runsCol.doc(latest) : null;
  if (!runRef || !(await runRef.get()).exists) {
    const open = await runsCol
      .where("status", "==", "running")
      .orderBy("startedAt", "desc")
      .limit(1)
      .get();
    if (open.empty) {
      throw new Error(
        `no open pipelineRun for assessments/${assessmentId} — call log-run --status running first`,
      );
    }
    runRef = open.docs[0].ref;
  }

  const update: Record<string, unknown> = {
    status,
    completedAt: FieldValue.serverTimestamp(),
  };
  if (error) update.errorMessage = error;
  if (reportPath) update.finalReportPath = reportPath;
  await runRef.update(update);

  console.log(
    `[assess-cli log-run] id=${assessmentId} runId=${runRef.id} status=${status}`,
  );
}
