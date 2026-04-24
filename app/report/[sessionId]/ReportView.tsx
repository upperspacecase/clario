"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, RefreshCw } from "lucide-react";
import type { GeneratedReport } from "@/server/session-store";

type ApiReport = {
  id: string;
  language: string | null;
  reportStatus: "pending" | "generating" | "ready" | "failed";
  reportError: string | null;
  report: GeneratedReport | null;
  transcript: { who: "agent" | "user"; text: string; ts: number }[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3043`
    : "http://localhost:3043");

export const ReportView: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const [data, setData] = useState<ApiReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const anchorRef = useRef<HTMLAnchorElement | null>(null);

  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/report/${sessionId}`);
      if (!res.ok) {
        setErr(`Server returned ${res.status}`);
        return;
      }
      const json = (await res.json()) as ApiReport;
      setData(json);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      await fetchOnce();
    };
    void poll();
    const id = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchOnce]);

  useEffect(() => {
    if (data?.reportStatus === "ready" || data?.reportStatus === "failed") {
      // stop polling by returning a no-op interval; handled above with cancel
    }
  }, [data?.reportStatus]);

  const download = useCallback(() => {
    if (!data?.report) return;
    const html = renderStandaloneHtml(data.report);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = anchorRef.current ?? document.createElement("a");
    a.href = url;
    a.download = `clario-report-${sessionId}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [data, sessionId]);

  if (err && !data) {
    return (
      <div className="rounded-lg border border-[color:var(--olive-soft)] bg-[var(--bg-card)] p-6">
        <p className="font-bold">Could not load report.</p>
        <p
          className="mt-2 text-[14px]"
          style={{ color: "var(--ink-soft)" }}
        >
          {err}. Make sure the Node server is running on :3043.
        </p>
        <button
          type="button"
          onClick={() => void fetchOnce()}
          className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold text-[var(--bg-cream)]"
          style={{ background: "var(--terracotta)" }}
        >
          <RefreshCw size={14} strokeWidth={2.5} /> Retry
        </button>
      </div>
    );
  }

  if (!data || data.reportStatus === "pending" || data.reportStatus === "generating") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[color:var(--olive-soft)] bg-[var(--bg-card)] p-6">
        <Loader2
          size={18}
          strokeWidth={2.5}
          className="animate-spin"
          style={{ color: "var(--olive)" }}
        />
        <p style={{ color: "var(--ink-soft)" }}>
          {data?.reportStatus === "generating"
            ? "Writing your report…"
            : "Waiting for the call to finish…"}
        </p>
      </div>
    );
  }

  if (data.reportStatus === "failed") {
    return (
      <div className="rounded-lg border border-[color:var(--terracotta)] bg-[var(--bg-card)] p-6">
        <p className="font-bold">Report generation failed.</p>
        <p
          className="mt-2 text-[14px]"
          style={{ color: "var(--ink-soft)" }}
        >
          {data.reportError ?? "Unknown error."}
        </p>
      </div>
    );
  }

  const r = data.report!;

  return (
    <article className="space-y-10">
      <a ref={anchorRef} className="hidden" aria-hidden />

      <header className="flex flex-col gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-label"
          style={{ color: "var(--olive)" }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Back
        </Link>
        <h1
          className="font-display font-black"
          style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            lineHeight: 1.02,
            letterSpacing: "-0.015em",
          }}
        >
          Your Clario report
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold text-[var(--bg-cream)]"
            style={{ background: "var(--terracotta)" }}
          >
            <Download size={14} strokeWidth={2.5} /> Download
          </button>
          <span
            className="text-[12px] font-bold uppercase tracking-label"
            style={{ color: "var(--ink-faint)" }}
          >
            Language · {r.language?.toUpperCase() ?? "?"}
          </span>
        </div>
      </header>

      <Section title="Executive summary">
        <p>{r.executiveSummary}</p>
      </Section>

      <Section title="Business snapshot">
        <p>{r.businessSnapshot}</p>
      </Section>

      <Section title="Top problems">
        <ol className="space-y-8">
          {r.topProblems.map((p, i) => (
            <li
              key={i}
              className="rounded-xl border border-[color:var(--olive-soft)] bg-[var(--bg-card)] p-6"
            >
              <p
                className="text-[11px] font-bold uppercase tracking-label"
                style={{ color: "var(--olive)" }}
              >
                Problem {i + 1}
              </p>
              <h3
                className="mt-1 font-display text-[22px] font-bold leading-tight"
                style={{ color: "var(--ink)" }}
              >
                {p.problem}
              </h3>
              <p
                className="mt-3 text-[14px]"
                style={{ color: "var(--ink-soft)" }}
              >
                {p.whyItMatters}
              </p>
              <ul className="mt-5 space-y-3">
                {p.recommendations.map((t, j) => (
                  <li
                    key={j}
                    className="rounded-lg border border-[color:var(--olive-soft)] p-4"
                    style={{ background: "var(--bg-cream)" }}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-bold underline"
                        style={{ color: "var(--ink)" }}
                      >
                        {t.name}
                      </a>
                      {t.startingPrice && (
                        <span
                          className="text-[12px]"
                          style={{ color: "var(--ink-faint)" }}
                        >
                          {t.startingPrice}
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-1 text-[14px]"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      {t.why}
                    </p>
                  </li>
                ))}
              </ul>
              <div
                className="mt-5 rounded-lg p-4"
                style={{
                  background: "var(--terracotta)",
                  color: "var(--bg-cream)",
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-label opacity-80">
                  This week
                </p>
                <p className="mt-1 text-[14px]">{p.nextStepThisWeek}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="30-day plan">
        <ol className="space-y-3">
          {r.thirtyDayPlan.map((item) => (
            <li
              key={item.priority}
              className="flex gap-4 rounded-lg border border-[color:var(--olive-soft)] p-4"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-[var(--bg-cream)]"
                style={{ background: "var(--olive)" }}
              >
                {item.priority}
              </div>
              <div>
                <p className="font-bold">{item.action}</p>
                <p
                  className="mt-1 text-[14px]"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {item.why}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Longer-term watch-items">
        <ul className="list-disc space-y-2 pl-5">
          {r.watchItems.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </Section>
    </article>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="space-y-4">
    <h2
      className="font-display text-[28px] font-bold"
      style={{ color: "var(--ink)" }}
    >
      {title}
    </h2>
    <div className="space-y-3 text-[15px] leading-[1.6]" style={{ color: "var(--ink-soft)" }}>
      {children}
    </div>
  </section>
);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStandaloneHtml(r: GeneratedReport): string {
  const css = `
    body { font-family: -apple-system, system-ui, sans-serif; background: #F8F2E6; color: #1E1A14; max-width: 760px; margin: 40px auto; padding: 0 20px; line-height: 1.55; }
    h1 { font-size: 42px; margin: 0 0 8px; letter-spacing: -0.01em; }
    h2 { font-size: 24px; margin-top: 36px; }
    h3 { font-size: 20px; margin: 0 0 8px; }
    .card { background: #FBF7EB; border: 1px solid rgba(162,138,67,0.34); border-radius: 12px; padding: 20px; margin: 12px 0; }
    .week { background: #C05A3E; color: #F8F2E6; padding: 14px; border-radius: 10px; margin-top: 14px; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #A28A43; }
    a { color: #1E1A14; }
    ol, ul { padding-left: 20px; }
    li { margin-bottom: 10px; }
  `;

  const probHtml = r.topProblems
    .map(
      (p, i) => `
    <div class="card">
      <p class="label">Problem ${i + 1}</p>
      <h3>${escapeHtml(p.problem)}</h3>
      <p>${escapeHtml(p.whyItMatters)}</p>
      <ul>
        ${p.recommendations
          .map(
            (t) => `<li>
              <a href="${escapeHtml(t.url)}"><strong>${escapeHtml(t.name)}</strong></a>${
                t.startingPrice ? ` · ${escapeHtml(t.startingPrice)}` : ""
              }<br/>${escapeHtml(t.why)}
            </li>`
          )
          .join("")}
      </ul>
      <div class="week"><strong>THIS WEEK:</strong> ${escapeHtml(p.nextStepThisWeek)}</div>
    </div>`
    )
    .join("");

  return `<!doctype html>
<html lang="${escapeHtml(r.language)}">
<head>
  <meta charset="utf-8"/>
  <title>Clario report</title>
  <style>${css}</style>
</head>
<body>
  <h1>Your Clario report</h1>
  <p class="label">Language · ${escapeHtml(r.language.toUpperCase())}</p>
  <h2>Executive summary</h2>
  <p>${escapeHtml(r.executiveSummary)}</p>
  <h2>Business snapshot</h2>
  <p>${escapeHtml(r.businessSnapshot)}</p>
  <h2>Top problems</h2>
  ${probHtml}
  <h2>30-day plan</h2>
  <ol>${r.thirtyDayPlan
    .map(
      (a) =>
        `<li><strong>${escapeHtml(a.action)}</strong> — ${escapeHtml(a.why)}</li>`
    )
    .join("")}</ol>
  <h2>Longer-term watch-items</h2>
  <ul>${r.watchItems.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>
</body>
</html>`;
}
