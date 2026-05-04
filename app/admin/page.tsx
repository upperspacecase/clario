"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { clientAuth, clientDb } from "@/lib/firebase-client";
import type { AssessmentStatus } from "@/lib/types";
import {
  AssessmentRow,
  type AssessmentRowData,
} from "@/components/admin/AssessmentRow";

type Filter = "all" | "queue" | "active" | "review" | "complete" | "failed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "queue", label: "Queue" },
  { id: "active", label: "Active" },
  { id: "review", label: "Review" },
  { id: "complete", label: "Complete" },
  { id: "failed", label: "Failed" },
];

function matchesFilter(status: AssessmentStatus, filter: Filter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "queue":
      return status === "pending_processing";
    case "active":
      return status === "in_call" || status === "processing";
    case "review":
      return status === "manual_review";
    case "complete":
      return status === "complete";
    case "failed":
      return status === "failed";
  }
}

function tsToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  return null;
}

export default function AdminPage() {
  const [rows, setRows] = useState<AssessmentRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const q = query(
      collection(clientDb(), "assessments"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: AssessmentRowData[] = snap.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          return {
            id: doc.id,
            shareId: (data.shareId as string | null) ?? null,
            clientName: (data.clientName as string | null) ?? null,
            clientEmail: (data.clientEmail as string | null) ?? null,
            businessName: (data.businessName as string | null) ?? null,
            industry: (data.industry as string | null) ?? null,
            callerRole: (data.callerRole as string | null) ?? null,
            status: (data.status as AssessmentStatus) ?? "pending_processing",
            startedAt: tsToDate(data.callStartedAt),
            createdAt: tsToDate(data.createdAt),
            durationSec: (data.callDurationSec as number | null) ?? null,
            paidAt: tsToDate(data.paidAt),
            amountPaidUsd: (data.amountPaidUsd as number | null) ?? null,
          };
        });
        setRows(next);
        setLoading(false);
      },
      (err) => {
        setError(err.message ?? "Failed to load assessments");
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => matchesFilter(r.status, filter)),
    [rows, filter],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: rows.length,
      queue: 0,
      active: 0,
      review: 0,
      complete: 0,
      failed: 0,
    };
    for (const r of rows) {
      if (matchesFilter(r.status, "queue")) c.queue++;
      if (matchesFilter(r.status, "active")) c.active++;
      if (matchesFilter(r.status, "review")) c.review++;
      if (matchesFilter(r.status, "complete")) c.complete++;
      if (matchesFilter(r.status, "failed")) c.failed++;
    }
    return c;
  }, [rows]);

  return (
    <main className="min-h-screen bg-surface page-light">
      <div className="mx-auto max-w-content px-[clamp(20px,5vw,48px)] py-12">
        <header className="flex items-end justify-between gap-4 border-b border-outline-variant pb-6">
          <div>
            <h1 className="font-display text-headline-md text-on-surface">
              Assessments
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Most recent 50 calls, live.
            </p>
          </div>
          <button
            onClick={() => signOut(clientAuth())}
            className="text-sm text-on-surface-variant hover:text-on-surface"
          >
            Sign out
          </button>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition " +
                  (active
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container")
                }
              >
                <span>{f.label}</span>
                <span
                  className={
                    "rounded-full px-1.5 text-[11px] tabular-nums " +
                    (active ? "bg-on-primary/20" : "bg-surface-container-high")
                  }
                >
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-on-surface-variant">
              Loading…
            </div>
          ) : error ? (
            <div className="rounded border border-error/40 bg-error-container p-4 text-sm text-on-error-container">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-on-surface-variant">
              No assessments {filter === "all" ? "yet" : `in “${filter}”`}.
            </div>
          ) : (
            <div className="border-t border-outline-variant/60">
              {filtered.map((row) => (
                <AssessmentRow key={row.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
