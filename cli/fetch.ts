// `assess-cli fetch` — pulls an assessment doc + transcript subcollection from
// Firestore into `runs/{assessmentId}/` so the GetHours skill pipeline can
// consume them. Source of truth for downstream skills is `transcript.json`.

import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../lib/firebase-admin.js";

type RawTurn = {
  turnId?: string;
  role?: "user" | "agent";
  text?: string;
  timestamp?: Timestamp | { seconds: number; nanoseconds: number } | null;
  sessionHandle?: string;
  isFinal?: boolean;
};

function isoFromMaybeTs(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in (value as Record<string, unknown>)
  ) {
    const v = value as { seconds: number; nanoseconds?: number };
    return new Date(v.seconds * 1000 + (v.nanoseconds ?? 0) / 1e6).toISOString();
  }
  return null;
}

function serializeAssessment(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Timestamp) {
      out[k] = v.toDate().toISOString();
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function runFetch(opts: {
  assessmentId: string;
  outDir: string;
}): Promise<void> {
  const { assessmentId, outDir } = opts;
  const db = adminDb();

  const docRef = db.collection("assessments").doc(assessmentId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new Error(
      `assessment not found: assessments/${assessmentId} (project=${process.env.FIREBASE_PROJECT_ID})`,
    );
  }
  const metadata = serializeAssessment(docSnap.data() ?? {});

  const turnSnap = await docRef
    .collection("transcript")
    .orderBy("turnId", "asc")
    .get();

  const rawTurns = turnSnap.docs.map((d) => {
    const t = d.data() as RawTurn;
    return {
      turnId: t.turnId ?? d.id,
      role: (t.role ?? "agent") as "user" | "agent",
      text: t.text ?? "",
      timestamp: isoFromMaybeTs(t.timestamp),
      sessionHandle: t.sessionHandle ?? "",
      isFinal: t.isFinal ?? false,
    };
  });

  // The voice server currently writes every transcription chunk as
  // isFinal:false (server/firestore-writer.ts records what Gemini Live
  // emits, and Live emits incremental chunks during streaming). Sub-skill
  // 01's contract assumes utterance-level finals, so coalesce consecutive
  // same-role chunks into one synthetic utterance per speaker turn.
  // Boundary rules:
  //   - role change → new utterance
  //   - same role, timestamp gap > 4s → new utterance (matches SPEC §5.3
  //     gap-detection threshold for sub-skill 01)
  // The first chunk's turnId/timestamp are kept; text fragments are
  // concatenated as-is (Gemini chunks already carry their own leading
  // spaces). isFinal is set to true on the merged result.
  const COALESCE_GAP_MS = 4000;
  const transcript: typeof rawTurns = [];
  for (const turn of rawTurns) {
    const prev = transcript[transcript.length - 1];
    const sameRole = prev && prev.role === turn.role;
    const gapMs =
      prev && prev.timestamp && turn.timestamp
        ? new Date(turn.timestamp).getTime() -
          new Date(prev.timestamp).getTime()
        : 0;
    if (sameRole && gapMs <= COALESCE_GAP_MS) {
      prev.text += turn.text;
      prev.isFinal = true;
    } else {
      transcript.push({ ...turn, isFinal: true });
    }
  }

  // Convenience .txt view: labeled prose, one block per utterance.
  const txtLines: string[] = [];
  for (const t of transcript) {
    const label = t.role === "agent" ? "Sam" : "Caller";
    txtLines.push(`${label}: ${t.text.trim()}`);
  }
  const transcriptText = txtLines.join("\n\n");

  const absOutDir = resolve(outDir);
  await mkdir(absOutDir, { recursive: true });
  await writeFile(
    resolve(absOutDir, "metadata.json"),
    JSON.stringify(metadata, null, 2) + "\n",
    "utf8",
  );
  await writeFile(
    resolve(absOutDir, "transcript.json"),
    JSON.stringify(transcript, null, 2) + "\n",
    "utf8",
  );
  await writeFile(
    resolve(absOutDir, "transcript-raw.json"),
    JSON.stringify(rawTurns, null, 2) + "\n",
    "utf8",
  );
  await writeFile(
    resolve(absOutDir, "transcript.txt"),
    transcriptText + (transcriptText.length > 0 ? "\n" : ""),
    "utf8",
  );

  console.log(
    `[assess-cli fetch] id=${assessmentId} chunks=${rawTurns.length} utterances=${transcript.length} out=${absOutDir}`,
  );
}
