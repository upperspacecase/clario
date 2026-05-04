"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { clientDb } from "@/lib/firebase-client";
import type { AssessmentStatus, TranscriptTurn } from "@/lib/types";
import { StatusChip } from "@/components/admin/StatusChip";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface TurnRow {
  turnId: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date | null;
}

function tsToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  return null;
}

export default function AdminLivePage({ params }: PageProps) {
  const { id } = use(params);

  const [status, setStatus] = useState<AssessmentStatus | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [turns, setTurns] = useState<TurnRow[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(clientDb(), "assessments", id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Record<string, unknown>;
      setStatus((data.status as AssessmentStatus) ?? null);
      setBusinessName((data.businessName as string | null) ?? null);
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    const q = query(
      collection(clientDb(), "assessments", id, "transcript"),
      orderBy("timestamp", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setTurns(
        snap.docs.map((doc) => {
          const data = doc.data() as Partial<TranscriptTurn>;
          return {
            turnId: doc.id,
            role: data.role ?? "user",
            text: data.text ?? "",
            timestamp: tsToDate(data.timestamp),
          };
        }),
      );
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  const coalesced = useMemo(() => {
    const out: { role: "user" | "agent"; text: string; ts: Date | null }[] = [];
    for (const t of turns) {
      const last = out[out.length - 1];
      if (last && last.role === t.role) {
        last.text += t.text;
      } else {
        out.push({ role: t.role, text: t.text, ts: t.timestamp });
      }
    }
    return out;
  }, [turns]);

  const isLive = status === "in_call";

  return (
    <main className="min-h-screen bg-surface page-light">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link href={`/admin/r/${id}`} className="text-sm text-on-surface-variant hover:text-on-surface">
            ← Back to assessment
          </Link>
          {status && <StatusChip status={status} />}
        </div>

        <header className="border-b border-outline-variant pb-4">
          <h1 className="font-display text-2xl text-on-surface">
            {businessName ?? "(unnamed business)"}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Live
              </span>
            ) : (
              "Call ended — view-only"
            )}
            {" · "}
            {turns.length} turns
          </p>
        </header>

        <div
          ref={scrollRef}
          className="mt-6 max-h-[70vh] space-y-4 overflow-y-auto rounded border border-outline-variant bg-surface-container-low p-5"
          style={{ scrollBehavior: "smooth" }}
        >
          {coalesced.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Waiting for transcript turns…
            </p>
          ) : (
            coalesced.map((t, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-outline">
                  {t.role === "agent" ? "Sam" : "Caller"}
                  {t.ts ? ` · ${t.ts.toLocaleTimeString()}` : ""}
                </span>
                <p className="text-[15px] leading-[1.6] text-on-surface">
                  {t.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
