"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth, clientDb } from "@/lib/firebase-client";
import type {
  AssessmentStatus,
  FourDayPlanItem,
  Headline,
  PainPoint,
  PipelineRun,
  Recommendation,
  TranscriptTurn,
  Upsell,
} from "@/lib/types";
import { StatusChip } from "@/components/admin/StatusChip";
import { Report, type ReportData } from "@/components/Report";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface AssessmentSnapshot {
  id: string;
  shareId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  businessName: string | null;
  industry: string | null;
  callerRole: string | null;
  status: AssessmentStatus;
  callStartedAt: Date | null;
  callEndedAt: Date | null;
  callDurationSec: number | null;
  createdAt: Date | null;
  emailedAt: Date | null;
  paidAt: Date | null;
  lastPipelineError: string | null;
}

interface TranscriptRow {
  turnId: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date | null;
  isFinal: boolean;
}

interface PipelineRunRow {
  runId: string;
  status: PipelineRun["status"];
  triggeredBy: PipelineRun["triggeredBy"];
  startedAt: Date | null;
  completedAt: Date | null;
}

interface ReportVersionRow {
  versionId: string;
  pipelineRunId: string | null;
  pipelineVersionId: string;
  generatedAt: Date | null;
  hoursPerWeek: number | null;
  monthlyValue: number | null;
}

function tsToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  return null;
}

function fmtDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleString();
}

function fmtDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminAssessmentPage({ params }: PageProps) {
  const { id } = use(params);

  const [assessment, setAssessment] = useState<AssessmentSnapshot | null>(null);
  const [transcript, setTranscript] = useState<TranscriptRow[]>([]);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRunRow[]>([]);
  const [reportVersions, setReportVersions] = useState<ReportVersionRow[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendOk, setSendOk] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(clientDb(), "assessments", id),
      (snap) => {
        if (!snap.exists()) {
          setError("Assessment not found.");
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        setAssessment({
          id,
          shareId: (data.shareId as string | null) ?? null,
          clientName: (data.clientName as string | null) ?? null,
          clientEmail: (data.clientEmail as string | null) ?? null,
          businessName: (data.businessName as string | null) ?? null,
          industry: (data.industry as string | null) ?? null,
          callerRole: (data.callerRole as string | null) ?? null,
          status: (data.status as AssessmentStatus) ?? "in_call",
          callStartedAt: tsToDate(data.callStartedAt),
          callEndedAt: tsToDate(data.callEndedAt),
          callDurationSec: (data.callDurationSec as number | null) ?? null,
          createdAt: tsToDate(data.createdAt),
          emailedAt: tsToDate(data.emailedAt),
          paidAt: tsToDate(data.paidAt),
          lastPipelineError: (data.lastPipelineError as string | null) ?? null,
        });
      },
      (err) => setError(err.message),
    );
    return unsub;
  }, [id]);

  useEffect(() => {
    const q = query(
      collection(clientDb(), "assessments", id, "transcript"),
      orderBy("timestamp", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setTranscript(
        snap.docs.map((doc) => {
          const data = doc.data() as Partial<TranscriptTurn>;
          return {
            turnId: doc.id,
            role: data.role ?? "user",
            text: data.text ?? "",
            timestamp: tsToDate(data.timestamp),
            isFinal: Boolean(data.isFinal),
          };
        }),
      );
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    const q = query(
      collection(clientDb(), "assessments", id, "pipelineRuns"),
      orderBy("startedAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setPipelineRuns(
        snap.docs.map((doc) => {
          const data = doc.data() as Partial<PipelineRun>;
          return {
            runId: doc.id,
            status: data.status ?? "running",
            triggeredBy: data.triggeredBy ?? "cli",
            startedAt: tsToDate(data.startedAt),
            completedAt: tsToDate(data.completedAt),
          };
        }),
      );
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    const q = query(
      collection(clientDb(), "assessments", id, "reportVersions"),
      orderBy("generatedAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setReportVersions(
        snap.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const headline = (data.headline as Headline | undefined) ?? null;
          return {
            versionId: doc.id,
            pipelineRunId: (data.pipelineRunId as string | null) ?? null,
            pipelineVersionId: (data.pipelineVersionId as string) ?? "",
            generatedAt: tsToDate(data.generatedAt),
            hoursPerWeek: headline?.hoursPerWeek ?? null,
            monthlyValue: headline?.monthlyValue ?? null,
          };
        }),
      );
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    const shareId = assessment?.shareId;
    if (!shareId) return;
    if (assessment?.status !== "manual_review" && assessment?.status !== "complete") {
      setReport(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const snap = await getDoc(doc(clientDb(), "publicReports", shareId));
        if (cancelled) return;
        if (!snap.exists()) {
          setReport(null);
          return;
        }
        const raw = snap.data() as Record<string, unknown>;
        setReport({
          shareId,
          clientName: (raw.clientName as string) ?? "",
          businessName: (raw.businessName as string) ?? "",
          generatedAt: tsToDate(raw.generatedAt)?.toLocaleString() ?? null,
          headline: raw.headline as Headline,
          executiveSummary: (raw.executiveSummary as string) ?? "",
          painPoints: (raw.painPoints as PainPoint[]) ?? [],
          recommendations: (raw.recommendations as Recommendation[]) ?? [],
          fourDayPlan: (raw.fourDayPlan as FourDayPlanItem[]) ?? [],
          upsells: (raw.upsells as Upsell[]) ?? [],
          bookingUrl: (raw.bookingUrl as string) ?? "",
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assessment?.shareId, assessment?.status]);

  const shareLink = assessment?.shareId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${assessment.shareId}`
    : "";

  const pipelineCommand = `/gethours-pipeline ${id}`;

  const canSend =
    assessment?.status === "manual_review" || assessment?.status === "complete";

  async function handleSend() {
    setSendError(null);
    setSendOk(null);
    setSending(true);
    try {
      const user = await new Promise<ReturnType<typeof clientAuth>["currentUser"]>(
        (resolve) => {
          const unsub = onAuthStateChanged(clientAuth(), (u) => {
            unsub();
            resolve(u);
          });
        },
      );
      if (!user) throw new Error("Not signed in");
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/send-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ assessmentId: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `send failed (${res.status})`);
      setSendOk("Report email sent.");
    } catch (e) {
      setSendError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  async function handleApproveFull() {
    setSendError(null);
    setSendOk(null);
    setSending(true);
    try {
      const user = await new Promise<ReturnType<typeof clientAuth>["currentUser"]>(
        (resolve) => {
          const unsub = onAuthStateChanged(clientAuth(), (u) => {
            unsub();
            resolve(u);
          });
        },
      );
      if (!user) throw new Error("Not signed in");
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/full/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ assessmentId: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `approve failed (${res.status})`);
      setSendOk(
        json.refunded
          ? "Approved and delivered — guarantee not met, refund issued."
          : "Approved and delivered.",
      );
    } catch (e) {
      setSendError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-surface page-light">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-error">{error}</p>
          <Link href="/admin" className="mt-4 inline-block text-sm text-primary underline">
            ← Back to queue
          </Link>
        </div>
      </main>
    );
  }

  if (!assessment) {
    return (
      <main className="min-h-screen bg-surface page-light">
        <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-on-surface-variant">
          Loading…
        </div>
      </main>
    );
  }

  const liveLink = `/admin/live/${id}`;

  return (
    <main className="min-h-screen bg-surface page-light">
      <div className="mx-auto max-w-content px-[clamp(20px,5vw,48px)] py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/admin" className="text-sm text-on-surface-variant hover:text-on-surface">
            ← Queue
          </Link>
          <StatusChip status={assessment.status} />
        </div>

        <header className="border-b border-outline-variant pb-6">
          <h1 className="font-display text-headline-md text-on-surface">
            {assessment.businessName ?? "(unnamed business)"}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {assessment.clientName ?? "—"}
            {assessment.clientEmail ? ` · ${assessment.clientEmail}` : ""}
            {assessment.industry ? ` · ${assessment.industry}` : ""}
            {assessment.callerRole ? ` · ${assessment.callerRole}` : ""}
          </p>
        </header>

        <Card title="Timeline">
          <DefList
            items={[
              ["Created", fmtDate(assessment.createdAt)],
              ["Call started", fmtDate(assessment.callStartedAt)],
              ["Call ended", fmtDate(assessment.callEndedAt)],
              ["Duration", fmtDuration(assessment.callDurationSec)],
              ["Paid", fmtDate(assessment.paidAt)],
              ["Emailed", fmtDate(assessment.emailedAt)],
            ]}
          />
        </Card>

        <Card title="Actions">
          <div className="flex flex-col gap-3">
            {assessment.status === "manual_review" && (
              <button
                onClick={handleApproveFull}
                disabled={sending}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {sending ? "Working…" : "Approve full report & deliver"}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!canSend || sending}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {sending
                ? "Sending…"
                : assessment.status === "complete"
                  ? "Re-send report email"
                  : "Send report to client"}
            </button>
            {sendOk && <p className="text-sm text-primary">{sendOk}</p>}
            {sendError && <p className="text-sm text-error">{sendError}</p>}
            {!canSend && (
              <p className="text-xs text-on-surface-variant">
                Sending is enabled once the pipeline writes the report (status reaches “Review”).
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {assessment.shareId && (
                <>
                  <Link
                    href={`/r/${assessment.shareId}`}
                    target="_blank"
                    className="rounded border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container"
                  >
                    Open public report
                  </Link>
                  <button
                    onClick={() => copyText(shareLink)}
                    className="rounded border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container"
                  >
                    Copy share link
                  </button>
                </>
              )}
              <Link
                href={liveLink}
                className="rounded border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container"
              >
                Live transcript view
              </Link>
            </div>
          </div>
        </Card>

        <Card title="Run pipeline locally">
          <p className="mb-2 text-xs text-on-surface-variant">
            On Tay's Mac:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-surface-container-low px-3 py-2 text-[13px] font-mono text-on-surface">
              {pipelineCommand}
            </code>
            <button
              onClick={() => copyText(pipelineCommand)}
              className="rounded border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container"
            >
              Copy
            </button>
          </div>
        </Card>

        <Card title={`Pipeline runs (${pipelineRuns.length})`}>
          {assessment.lastPipelineError ? (
            <div className="mb-3 rounded border border-error/40 bg-error-container/40 p-3 text-sm text-on-error-container">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                Last error
              </div>
              <p className="mt-1 break-words font-mono text-[12px]">
                {assessment.lastPipelineError}
              </p>
            </div>
          ) : null}
          {pipelineRuns.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No runs yet.</p>
          ) : (
            <ul className="space-y-2">
              {pipelineRuns.map((r) => (
                <li
                  key={r.runId}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-outline-variant/60 pb-2 last:border-b-0"
                >
                  <span
                    className={
                      "rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] " +
                      (r.status === "success"
                        ? "bg-primary/10 text-primary"
                        : r.status === "failed"
                          ? "bg-error-container text-on-error-container"
                          : "bg-tertiary-container text-on-tertiary-container")
                    }
                  >
                    {r.status}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {fmtDate(r.startedAt)}
                  </span>
                  <span className="text-xs text-outline">via {r.triggeredBy}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Report versions (${reportVersions.length})`}>
          {reportVersions.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No reports yet. Re-running the pipeline will archive each successful
              version here. The customer always sees the latest at /r/{assessment.shareId ?? "—"}.
            </p>
          ) : (
            <ul className="space-y-2">
              {reportVersions.map((v, i) => (
                <li
                  key={v.versionId}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-outline-variant/60 pb-2 last:border-b-0"
                >
                  <span
                    className={
                      "rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] " +
                      (i === 0
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-container-high text-on-surface-variant")
                    }
                  >
                    {i === 0 ? "live" : `v${reportVersions.length - i}`}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {fmtDate(v.generatedAt)}
                  </span>
                  {v.hoursPerWeek != null && v.monthlyValue != null ? (
                    <span className="text-xs text-outline">
                      {v.hoursPerWeek}h/wk · ${v.monthlyValue}/mo
                    </span>
                  ) : null}
                  <span className="font-mono text-[11px] text-outline">
                    {v.pipelineVersionId || v.versionId}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title={`Transcript (${transcript.length} turns)`}
          right={
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="text-xs text-on-surface-variant hover:text-on-surface"
            >
              {showTranscript ? "Hide" : "Show"}
            </button>
          }
        >
          {showTranscript &&
            (transcript.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No transcript yet.</p>
            ) : (
              <div className="max-h-[480px] space-y-3 overflow-y-auto rounded border border-outline-variant bg-surface-container-low p-4">
                <TranscriptList turns={transcript} />
              </div>
            ))}
        </Card>

        <Card title="Report preview">
          {report ? (
            <ReportPreview report={report} />
          ) : (
            <p className="text-sm text-on-surface-variant">
              {assessment.status === "manual_review" || assessment.status === "complete"
                ? "Loading report…"
                : "Report will appear here once the pipeline finishes."}
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-md border border-outline-variant bg-surface p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-[Inter] text-[13px] font-semibold uppercase tracking-[0.1em] text-outline">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function DefList({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-xs uppercase tracking-[0.08em] text-outline">{label}</dt>
          <dd className="text-sm text-on-surface">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TranscriptList({ turns }: { turns: TranscriptRow[] }) {
  // Coalesce consecutive same-role chunks for readability.
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

  return (
    <ul className="space-y-3">
      {coalesced.map((t, i) => (
        <li key={i} className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-outline">
            {t.role === "agent" ? "Sam" : "Caller"}
            {t.ts ? ` · ${t.ts.toLocaleTimeString()}` : ""}
          </span>
          <p className="text-sm leading-[1.6] text-on-surface">{t.text}</p>
        </li>
      ))}
    </ul>
  );
}

function ReportPreview({ report }: { report: ReportData }) {
  return (
    <div className="-mx-5 -mb-5 overflow-hidden rounded-b-md border-t border-outline-variant bg-background">
      <Report data={report} />
    </div>
  );
}
