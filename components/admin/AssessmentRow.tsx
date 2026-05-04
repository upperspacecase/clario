"use client";

import Link from "next/link";
import { useState } from "react";
import { clientAuth } from "@/lib/firebase-client";
import type { AssessmentStatus } from "@/lib/types";
import { StatusChip } from "./StatusChip";

export interface AssessmentRowData {
  id: string;
  shareId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  businessName: string | null;
  industry: string | null;
  callerRole: string | null;
  status: AssessmentStatus;
  startedAt: Date | null;
  createdAt: Date | null;
  durationSec: number | null;
  paidAt: Date | null;
  amountPaidUsd: number | null;
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRelative(date: Date | null): string {
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function PaymentChip({
  paidAt,
  amountUsd,
}: {
  paidAt: Date | null;
  amountUsd: number | null;
}) {
  if (paidAt) {
    const label = amountUsd != null ? `Paid · $${amountUsd}` : "Paid";
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-primary">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-on-surface-variant">
      Unpaid
    </span>
  );
}

function ProcessButton({ assessmentId }: { assessmentId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const user = clientAuth().currentUser;
      const token = user ? await user.getIdToken() : null;
      if (!token) {
        setError("Not signed in");
        return;
      }
      const res = await fetch(
        `/api/admin/assessments/${assessmentId}/process`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? `HTTP ${res.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-on-primary transition hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? "…" : "Process"}
      </button>
      {error ? <span className="text-[11px] text-error">{error}</span> : null}
    </div>
  );
}

function CopyIdButton({ assessmentId }: { assessmentId: string }) {
  const [copied, setCopied] = useState(false);
  async function onClick() {
    try {
      await navigator.clipboard.writeText(assessmentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore — clipboard not available
    }
  }
  return (
    <button
      onClick={onClick}
      title="Copy assessment ID for /gethours-pipeline"
      className="inline-flex items-center rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface-variant transition hover:bg-surface-container"
    >
      {copied ? "Copied" : "Copy ID"}
    </button>
  );
}

export function AssessmentRow({ row }: { row: AssessmentRowData }) {
  const when = row.startedAt ?? row.createdAt;

  return (
    <div className="flex items-start gap-4 border-b border-outline-variant/60 py-4">
      <Link href={`/admin/r/${row.id}`} className="min-w-0 flex-1">
        <div className="text-[15px] font-medium text-on-surface hover:underline">
          {row.clientName ?? <span className="text-on-surface-variant">—</span>}
        </div>
        <div className="text-sm text-on-surface-variant">
          {row.businessName ?? "—"}
          {row.industry ? <span className="text-outline"> · {row.industry}</span> : null}
          {row.callerRole ? <span className="text-outline"> · {row.callerRole}</span> : null}
        </div>
      </Link>

      <div className="flex w-28 flex-shrink-0 flex-col items-start gap-1">
        <StatusChip status={row.status} />
        <PaymentChip paidAt={row.paidAt} amountUsd={row.amountPaidUsd} />
      </div>

      <div className="hidden w-32 flex-shrink-0 text-sm text-on-surface-variant sm:block">
        <div title={when ? when.toLocaleString() : undefined}>{formatRelative(when)}</div>
      </div>

      <div className="hidden w-16 flex-shrink-0 text-right text-sm tabular-nums text-on-surface-variant md:block">
        {formatDuration(row.durationSec)}
      </div>

      <div className="w-28 flex-shrink-0 text-right text-sm">
        {row.status === "pending_processing" ? (
          <ProcessButton assessmentId={row.id} />
        ) : row.status === "processing" ? (
          <CopyIdButton assessmentId={row.id} />
        ) : (
          <Link
            href={`/admin/r/${row.id}`}
            className="text-primary underline-offset-2 hover:underline"
          >
            View →
          </Link>
        )}
      </div>
    </div>
  );
}
