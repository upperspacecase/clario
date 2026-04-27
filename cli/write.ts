// `assess-cli write` — atomic batch write of the assembled report to
// `assessments/{id}` (admin doc) AND `publicReports/{shareId}` (public doc).
// Reads the pre-assembled payload from `runs/{id}/08-write-output.json`,
// produced by sub-skill 08. Will not invent fields, will not write partial
// state — both docs commit in one Firestore WriteBatch or neither.

import { readFile } from "fs/promises";
import { resolve } from "path";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../lib/firebase-admin.js";

type AssessmentPatch = {
  headline: Record<string, unknown>;
  executiveSummary: string;
  fourDayPlan: unknown[];
  pipelineVersionId: string;
};

type PublicReport = {
  shareId: string;
  assessmentId: string;
  clientName: string;
  businessName: string;
  headline: Record<string, unknown>;
  executiveSummary: string;
  painPoints: unknown[];
  recommendations: unknown[];
  fourDayPlan: unknown[];
  upsells: unknown[];
  bookingUrl: string;
  expiresAt: null | string;
};

type WritePayload = {
  assessmentPatch: AssessmentPatch;
  publicReport: PublicReport;
};

function assertWritePayload(x: unknown): asserts x is WritePayload {
  if (!x || typeof x !== "object") {
    throw new Error("08-write-output.json: not an object");
  }
  const p = x as Record<string, unknown>;
  if (!p.assessmentPatch || typeof p.assessmentPatch !== "object") {
    throw new Error("08-write-output.json: missing assessmentPatch");
  }
  if (!p.publicReport || typeof p.publicReport !== "object") {
    throw new Error("08-write-output.json: missing publicReport");
  }
  const ap = p.assessmentPatch as Record<string, unknown>;
  for (const k of [
    "headline",
    "executiveSummary",
    "fourDayPlan",
    "pipelineVersionId",
  ]) {
    if (!(k in ap)) {
      throw new Error(`08-write-output.json: assessmentPatch missing ${k}`);
    }
  }
  const pr = p.publicReport as Record<string, unknown>;
  for (const k of [
    "shareId",
    "assessmentId",
    "clientName",
    "businessName",
    "headline",
    "executiveSummary",
    "painPoints",
    "recommendations",
    "fourDayPlan",
    "upsells",
    "bookingUrl",
  ]) {
    if (!(k in pr)) {
      throw new Error(`08-write-output.json: publicReport missing ${k}`);
    }
  }
}

export async function runWrite(opts: {
  assessmentId: string;
  fromDir: string;
}): Promise<void> {
  const { assessmentId, fromDir } = opts;
  const payloadPath = resolve(fromDir, "08-write-output.json");
  const raw = await readFile(payloadPath, "utf8");
  const payload: unknown = JSON.parse(raw);
  assertWritePayload(payload);

  const db = adminDb();
  const assessmentRef = db.collection("assessments").doc(assessmentId);
  const existing = await assessmentRef.get();
  if (!existing.exists) {
    throw new Error(`assessment not found: assessments/${assessmentId}`);
  }
  const existingShareId = (existing.data() as { shareId?: string }).shareId;
  if (!existingShareId) {
    throw new Error(`assessment ${assessmentId} has no shareId`);
  }
  if (existingShareId !== payload.publicReport.shareId) {
    throw new Error(
      `shareId mismatch: assessment=${existingShareId} payload=${payload.publicReport.shareId}`,
    );
  }
  if (payload.publicReport.assessmentId !== assessmentId) {
    throw new Error(
      `assessmentId mismatch: cli=${assessmentId} payload=${payload.publicReport.assessmentId}`,
    );
  }

  const publicReportRef = db
    .collection("publicReports")
    .doc(payload.publicReport.shareId);

  const batch = db.batch();
  batch.update(assessmentRef, {
    headline: payload.assessmentPatch.headline,
    executiveSummary: payload.assessmentPatch.executiveSummary,
    fourDayPlan: payload.assessmentPatch.fourDayPlan,
    pipelineVersionId: payload.assessmentPatch.pipelineVersionId,
    status: "manual_review",
    completedAt: FieldValue.serverTimestamp(),
  });
  batch.set(
    publicReportRef,
    {
      ...payload.publicReport,
      generatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();

  console.log(
    `[assess-cli write] id=${assessmentId} shareId=${payload.publicReport.shareId} status=manual_review`,
  );
}
