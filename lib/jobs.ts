// Firestore-backed durable job queue, consumed by server/worker.ts on Fly.
// Deliberately small: transactional claim, bounded retries, idempotent
// enqueue by deterministic ID so webhook/socket retries can't duplicate work.

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

export type JobType =
  | "extract_observations"
  | "generate_free_report"
  | "extract_full_observations"
  | "generate_full_report";
export type JobStatus = "queued" | "running" | "done" | "failed";

export interface Job {
  type: JobType;
  assessmentId: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Timestamp;
  startedAt: Timestamp | null;
  finishedAt: Timestamp | null;
  lastError: string | null;
}

const MAX_ATTEMPTS = 3;

// One job per (type, assessment): re-enqueueing an existing done/failed job
// resets it, re-enqueueing a queued/running one is a no-op.
export async function enqueueJob(type: JobType, assessmentId: string): Promise<string> {
  const id = `${type}_${assessmentId}`;
  const ref = adminDb().collection("jobs").doc(id);
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const status = snap.data()?.status as JobStatus | undefined;
    if (status === "queued" || status === "running") return;
    tx.set(ref, {
      type,
      assessmentId,
      status: "queued" satisfies JobStatus,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      createdAt: FieldValue.serverTimestamp(),
      startedAt: null,
      finishedAt: null,
      lastError: null,
    });
  });
  return id;
}

export async function claimNextJob(): Promise<{ id: string; job: Job } | null> {
  const db = adminDb();
  // No orderBy: a single-field where needs no composite index, so the queue
  // works on a fresh Firebase project with zero setup. FIFO is approximated
  // by sorting the small candidate batch in memory.
  const candidates = await db
    .collection("jobs")
    .where("status", "==", "queued")
    .limit(10)
    .get();

  const ordered = [...candidates.docs].sort(
    (x, y) => (x.createTime?.toMillis() ?? 0) - (y.createTime?.toMillis() ?? 0),
  );

  for (const doc of ordered) {
    const claimed = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(doc.ref);
      if (fresh.data()?.status !== "queued") return false;
      tx.update(doc.ref, {
        status: "running" satisfies JobStatus,
        attempts: FieldValue.increment(1),
        startedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    if (claimed) {
      const fresh = await doc.ref.get();
      return { id: doc.id, job: fresh.data() as Job };
    }
  }
  return null;
}

export async function completeJob(id: string): Promise<void> {
  await adminDb().collection("jobs").doc(id).update({
    status: "done" satisfies JobStatus,
    finishedAt: FieldValue.serverTimestamp(),
    lastError: null,
  });
}

export async function failJob(id: string, error: string): Promise<void> {
  const ref = adminDb().collection("jobs").doc(id);
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!data) return;
    const exhausted = (data.attempts as number) >= (data.maxAttempts as number);
    tx.update(ref, {
      status: (exhausted ? "failed" : "queued") satisfies JobStatus,
      finishedAt: exhausted ? FieldValue.serverTimestamp() : null,
      lastError: error,
    });
  });
}
