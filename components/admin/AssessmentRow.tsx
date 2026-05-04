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

const ENABLED_BTN =
  "inline-flex items-center rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-on-primary transition hover:bg-primary/90 disabled:opacity-60";

const DISABLED_BTN =
  "inline-flex items-center rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface-variant opacity-60 cursor-not-allowed";

function PipelineButton({
  status,
  assessmentId,
}: {
  status: AssessmentStatus;
  assessmentId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"queued" | "copied" | null>(null);

  const command = `/gethours-pipeline ${assessmentId}`;
  const canQueue =
    status === "pending_processing" ||
    status === "failed" ||
    status === "manual_review" ||
    status === "complete";
  const canRecopy = status === "processing";
  const enabled = canQueue || canRecopy;

  let label: string;
  let tooltip: string;
  if (canQueue) {
    if (status === "manual_review" || status === "complete") {
      label = "Re-run";
      tooltip = `Run the pipeline again and copy ${command} to your clipboard. The new report replaces the public link; the previous version is archived in this assessment's history.`;
    } else if (status === "failed") {
      label = "Re-run";
      tooltip = `Re-queue for processing and copy ${command} to your clipboard. Paste it in your terminal.`;
    } else {
      label = "Process";
      tooltip = `Queue for processing and copy ${command} to your clipboard. Paste it in your terminal.`;
    }
  } else if (canRecopy) {
    label = "Copy cmd";
    tooltip = `Already queued. Re-copy ${command} if you lost it from your clipboard.`;
  } else if (status === "in_call") {
    label = "Process";
    tooltip = "Wait — call is in progress.";
  } else if (status === "awaiting_details") {
    label = "Process";
    tooltip = "Wait — customer hasn't confirmed details yet.";
  } else {
    label = "Process";
    tooltip = "Not available in this state.";
  }

  if (feedback === "queued") label = "Paste in terminal →";
  if (feedback === "copied") label = "Copied — paste it";

  async function copyCmd(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(command);
      return true;
    } catch {
      return false;
    }
  }

  async function onClick() {
    setError(null);
    if (canQueue) {
      setBusy(true);
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
          return;
        }
        const copied = await copyCmd();
        setFeedback("queued");
        setTimeout(() => setFeedback(null), 3500);
        if (!copied) setError("Could not copy — copy manually");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    } else if (canRecopy) {
      const copied = await copyCmd();
      if (copied) {
        setFeedback("copied");
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setError("Clipboard unavailable");
      }
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={!enabled || busy}
        title={tooltip}
        className={enabled ? ENABLED_BTN : DISABLED_BTN}
      >
        {busy ? "…" : label}
      </button>
      {error ? <span className="text-[11px] text-error">{error}</span> : null}
    </div>
  );
}

function SendButton({
  status,
  assessmentId,
}: {
  status: AssessmentStatus;
  assessmentId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const enabled = status === "manual_review" || status === "complete";

  let label: string;
  let tooltip: string;
  if (status === "manual_review") {
    label = "Send report";
    tooltip = "Email the report link to the customer.";
  } else if (status === "complete") {
    label = "Re-send";
    tooltip = "Re-send the report email to the customer.";
  } else if (status === "in_call" || status === "awaiting_details") {
    label = "Send report";
    tooltip = "Wait — call hasn't finished yet.";
  } else if (status === "failed") {
    label = "Send report";
    tooltip = "Pipeline failed. Re-run it first.";
  } else {
    label = "Send report";
    tooltip = "Wait — pipeline hasn't written the report yet.";
  }

  if (sent) label = "Sent ✓";

  async function onClick() {
    if (!enabled) return;
    setBusy(true);
    setError(null);
    try {
      const user = clientAuth().currentUser;
      const token = user ? await user.getIdToken() : null;
      if (!token) {
        setError("Not signed in");
        return;
      }
      const res = await fetch("/api/admin/send-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assessmentId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? `HTTP ${res.status}`);
        return;
      }
      setSent(true);
      setTimeout(() => setSent(false), 2000);
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
        disabled={!enabled || busy}
        title={tooltip}
        className={enabled ? ENABLED_BTN : DISABLED_BTN}
      >
        {busy ? "…" : label}
      </button>
      {error ? <span className="text-[11px] text-error">{error}</span> : null}
    </div>
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

      <div className="flex flex-shrink-0 items-start justify-end gap-2">
        <PipelineButton status={row.status} assessmentId={row.id} />
        <SendButton status={row.status} assessmentId={row.id} />
      </div>
    </div>
  );
}
