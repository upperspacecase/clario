"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Eye,
} from "lucide-react";
import type {
  GeneratedReport,
  ReportBlock,
} from "@/server/session-store";

type ApiReport = {
  id: string;
  language: string | null;
  reportStatus: "pending" | "generating" | "ready" | "failed";
  reportError: string | null;
  report: GeneratedReport | null;
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
      setData(await res.json());
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

  const download = useCallback(() => {
    if (!data?.report) return;
    const html = renderStandaloneHtml(data.report);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = anchorRef.current ?? document.createElement("a");
    a.href = url;
    a.download = `hours-report-${sessionId}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [data, sessionId]);

  if (err && !data) {
    return (
      <StatusBox tone="error">
        <p className="font-bold">Could not load report.</p>
        <p className="mt-2 text-[14px]" style={{ color: "var(--ink-soft)" }}>
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
      </StatusBox>
    );
  }

  if (
    !data ||
    data.reportStatus === "pending" ||
    data.reportStatus === "generating"
  ) {
    return (
      <StatusBox>
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
      </StatusBox>
    );
  }

  if (data.reportStatus === "failed") {
    return (
      <StatusBox tone="error">
        <p className="font-bold">We couldn&apos;t write a report.</p>
        <p className="mt-2 text-[14px]" style={{ color: "var(--ink-soft)" }}>
          {data.reportError ?? "Unknown error."}
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold text-[var(--bg-cream)]"
          style={{ background: "var(--terracotta)" }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Try again
        </Link>
      </StatusBox>
    );
  }

  const r = data.report!;

  return (
    <article className="space-y-8">
      <a ref={anchorRef} className="hidden" aria-hidden />

      <header className="flex flex-col gap-5">
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
          {r.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
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

      <div className="space-y-8">
        {r.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </article>
  );
};

/* ----------------------- Block renderers ----------------------- */

const Block: React.FC<{ block: ReportBlock }> = ({ block }) => {
  switch (block.type) {
    case "heading":
      return (
        <h2
          className="font-display text-[28px] font-bold"
          style={{ color: "var(--ink)" }}
        >
          {block.text}
        </h2>
      );

    case "paragraph":
      return (
        <p
          className="text-[16px] leading-[1.65]"
          style={{ color: "var(--ink-soft)" }}
        >
          {block.text}
        </p>
      );

    case "bullets":
      return (
        <ul className="list-disc space-y-2 pl-5">
          {(block.items ?? []).map((item, i) => (
            <li
              key={i}
              className="text-[15px] leading-[1.6]"
              style={{ color: "var(--ink-soft)" }}
            >
              {item}
            </li>
          ))}
        </ul>
      );

    case "problem":
      return (
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--olive-soft)",
          }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-label"
            style={{ color: "var(--olive)" }}
          >
            Problem
          </p>
          <h3
            className="mt-1 font-display text-[22px] font-bold leading-tight"
            style={{ color: "var(--ink)" }}
          >
            {block.title}
          </h3>
          {block.body && (
            <p
              className="mt-3 text-[15px] leading-[1.6]"
              style={{ color: "var(--ink-soft)" }}
            >
              {block.body}
            </p>
          )}
        </div>
      );

    case "tools":
      return (
        <div className="space-y-3">
          {block.intro && (
            <p
              className="text-[15px] leading-[1.6]"
              style={{ color: "var(--ink-soft)" }}
            >
              {block.intro}
            </p>
          )}
          <ul className="space-y-3">
            {(block.tools ?? []).map((t, i) => (
              <li
                key={i}
                className="rounded-lg p-4"
                style={{
                  background: "var(--bg-cream)",
                  border: "1px solid var(--olive-soft)",
                }}
              >
                <div className="flex flex-wrap items-baseline gap-x-3">
                  {t.url ? (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-bold underline"
                      style={{ color: "var(--ink)" }}
                    >
                      {t.name}
                    </a>
                  ) : (
                    <span
                      className="font-bold"
                      style={{ color: "var(--ink)" }}
                    >
                      {t.name}
                    </span>
                  )}
                  {t.price && (
                    <span
                      className="text-[12px]"
                      style={{ color: "var(--ink-faint)" }}
                    >
                      {t.price}
                    </span>
                  )}
                </div>
                <p
                  className="mt-1 text-[14px] leading-[1.55]"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {t.why}
                </p>
              </li>
            ))}
          </ul>
        </div>
      );

    case "actions":
      return (
        <div className="space-y-3">
          {block.title && (
            <h3
              className="font-display text-[22px] font-bold"
              style={{ color: "var(--ink)" }}
            >
              {block.title}
            </h3>
          )}
          <ol className="space-y-3">
            {(block.actions ?? []).map((a, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-lg p-4"
                style={{ border: "1px solid var(--olive-soft)" }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-[var(--bg-cream)]"
                  style={{ background: "var(--olive)" }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <p className="font-bold" style={{ color: "var(--ink)" }}>
                      {a.action}
                    </p>
                    {a.when && (
                      <span
                        className="text-[11px] font-bold uppercase tracking-label"
                        style={{ color: "var(--olive)" }}
                      >
                        {a.when}
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-1 text-[14px] leading-[1.55]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {a.why}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );

    case "callout": {
      const tones = {
        "next-step": {
          bg: "var(--terracotta)",
          fg: "var(--bg-cream)",
          label: "This week",
          Icon: null as null,
        },
        note: {
          bg: "var(--bg-card)",
          fg: "var(--ink)",
          label: "Note",
          Icon: null as null,
        },
        watch: {
          bg: "var(--bg-card)",
          fg: "var(--ink)",
          label: "Watch",
          Icon: Eye,
        },
      } as const;
      const tone = tones[block.tone ?? "note"];
      const IconCmp =
        (block.tone ?? "note") === "watch"
          ? Eye
          : block.tone === "next-step"
            ? null
            : AlertTriangle;
      return (
        <div
          className="rounded-lg p-4"
          style={{
            background: tone.bg,
            color: tone.fg,
            border:
              block.tone === "next-step"
                ? "none"
                : "1px solid var(--olive-soft)",
          }}
        >
          <div className="flex items-start gap-3">
            {IconCmp && (
              <IconCmp
                size={16}
                strokeWidth={2.5}
                className="mt-0.5 shrink-0"
              />
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-label opacity-80">
                {tone.label}
              </p>
              <p className="mt-1 text-[15px] leading-[1.55]">{block.text}</p>
            </div>
          </div>
        </div>
      );
    }
  }
};

/* ----------------------- Helpers ----------------------- */

const StatusBox: React.FC<{
  tone?: "error";
  children: React.ReactNode;
}> = ({ tone, children }) => (
  <div
    className="flex flex-col gap-3 rounded-lg p-6"
    style={{
      background: "var(--bg-card)",
      border:
        tone === "error"
          ? "1px solid var(--terracotta)"
          : "1px solid var(--olive-soft)",
    }}
  >
    {children}
  </div>
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
    body { font-family: -apple-system, system-ui, sans-serif; background: #F8F2E6; color: #1E1A14; max-width: 760px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { font-size: 42px; margin: 0 0 12px; letter-spacing: -0.01em; }
    h2 { font-size: 26px; margin: 30px 0 10px; }
    h3 { font-size: 20px; margin: 0 0 8px; }
    .card { background: #FBF7EB; border: 1px solid rgba(162,138,67,0.34); border-radius: 12px; padding: 20px; margin: 16px 0; }
    .callout-next { background: #C05A3E; color: #F8F2E6; padding: 16px; border-radius: 10px; margin: 16px 0; }
    .callout-note, .callout-watch { background: #FBF7EB; border: 1px solid rgba(162,138,67,0.34); padding: 14px; border-radius: 10px; margin: 16px 0; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #A28A43; }
    a { color: #1E1A14; }
    ol, ul { padding-left: 22px; }
    li { margin-bottom: 8px; }
    .action-row { display: flex; gap: 10px; }
    .action-row strong { color: #1E1A14; }
  `;

  const renderBlock = (b: ReportBlock): string => {
    switch (b.type) {
      case "heading":
        return `<h2>${escapeHtml(b.text ?? "")}</h2>`;
      case "paragraph":
        return `<p>${escapeHtml(b.text ?? "")}</p>`;
      case "bullets":
        return `<ul>${(b.items ?? [])
          .map((i) => `<li>${escapeHtml(i)}</li>`)
          .join("")}</ul>`;
      case "problem":
        return `<div class="card"><p class="label">Problem</p><h3>${escapeHtml(b.title ?? "")}</h3>${b.body ? `<p>${escapeHtml(b.body)}</p>` : ""}</div>`;
      case "tools":
        return `${b.intro ? `<p>${escapeHtml(b.intro)}</p>` : ""}<ul>${(b.tools ?? [])
          .map((t) => {
            const link = t.url
              ? `<a href="${escapeHtml(t.url)}"><strong>${escapeHtml(t.name)}</strong></a>`
              : `<strong>${escapeHtml(t.name)}</strong>`;
            const price = t.price ? ` · ${escapeHtml(t.price)}` : "";
            return `<li>${link}${price}<br/>${escapeHtml(t.why)}</li>`;
          })
          .join("")}</ul>`;
      case "actions":
        return `${b.title ? `<h3>${escapeHtml(b.title)}</h3>` : ""}<ol>${(b.actions ?? [])
          .map(
            (a) =>
              `<li><strong>${escapeHtml(a.action)}</strong>${a.when ? ` <em>(${escapeHtml(a.when)})</em>` : ""} — ${escapeHtml(a.why)}</li>`
          )
          .join("")}</ol>`;
      case "callout": {
        const cls =
          b.tone === "next-step"
            ? "callout-next"
            : b.tone === "watch"
              ? "callout-watch"
              : "callout-note";
        const label =
          b.tone === "next-step"
            ? "This week"
            : b.tone === "watch"
              ? "Watch"
              : "Note";
        return `<div class="${cls}"><p class="label" style="opacity:.8">${label}</p><p>${escapeHtml(b.text ?? "")}</p></div>`;
      }
    }
  };

  return `<!doctype html>
<html lang="${escapeHtml(r.language)}">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(r.title)}</title>
  <style>${css}</style>
</head>
<body>
  <h1>${escapeHtml(r.title)}</h1>
  <p class="label">Language · ${escapeHtml(r.language.toUpperCase())}</p>
  ${r.blocks.map(renderBlock).join("\n  ")}
</body>
</html>`;
}
