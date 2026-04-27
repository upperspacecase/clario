import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../lib/firebase-admin.js";

export type BufferedTurn = {
  role: "user" | "agent";
  text: string;
  sessionHandle: string;
  isFinal: boolean;
};

const FLUSH_INTERVAL_MS = 500;
const FLUSH_THRESHOLD = 25;

export class TranscriptBuffer {
  private readonly assessmentId: string;
  private buffer: BufferedTurn[] = [];
  private counter = 0;
  private timer: NodeJS.Timeout | null = null;
  private flushing: Promise<void> | null = null;

  constructor(assessmentId: string) {
    this.assessmentId = assessmentId;
  }

  push(turn: BufferedTurn): void {
    if (!turn.text || !turn.text.trim()) return;
    this.buffer.push(turn);
    if (this.buffer.length >= FLUSH_THRESHOLD) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing) {
      await this.flushing;
      if (this.buffer.length === 0) return;
    }
    if (this.buffer.length === 0) return;

    const drain = this.buffer;
    this.buffer = [];

    this.flushing = (async () => {
      try {
        const db = adminDb();
        const batch = db.batch();
        const transcriptRef = db
          .collection("assessments")
          .doc(this.assessmentId)
          .collection("transcript");

        for (const turn of drain) {
          const turnId = this.nextTurnId();
          const docRef = transcriptRef.doc(turnId);
          batch.set(docRef, {
            turnId,
            role: turn.role,
            text: turn.text,
            timestamp: FieldValue.serverTimestamp(),
            sessionHandle: turn.sessionHandle,
            isFinal: turn.isFinal,
          });
        }

        await batch.commit();
        console.log(
          `[FIRESTORE] flushed ${drain.length} turns assessment=${this.assessmentId}`,
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(
          `[FIRESTORE] flush failed assessment=${this.assessmentId}:`,
          msg,
        );
        this.buffer.unshift(...drain);
      } finally {
        this.flushing = null;
      }
    })();

    await this.flushing;
  }

  startAutoFlush(intervalMs: number = FLUSH_INTERVAL_MS): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.flush();
    }, intervalMs);
  }

  stopAutoFlush(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private nextTurnId(): string {
    this.counter += 1;
    const ts = Date.now().toString().padStart(13, "0");
    const seq = this.counter.toString().padStart(6, "0");
    return `${ts}-${seq}`;
  }
}
