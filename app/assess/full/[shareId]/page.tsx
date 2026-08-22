"use client";

// Written Full Assessment: work through the six workflows one screen at a
// time. Workflows already covered by the free assessment start marked done;
// any workflow can be skipped — the engine treats it as unknown, honestly.

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WORKFLOWS } from "@/lib/taxonomy";
import { WorkflowQuestions, type WorkflowAnswers } from "@/components/WorkflowQuestions";

export default function FullAssessFormPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = use(params);
  const [token, setToken] = useState<string | null>(null);
  const [covered, setCovered] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<WorkflowAnswers>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      const res = await fetch("/api/assess-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", shareId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not start");
        return;
      }
      setToken(data.token);
      setCovered(new Set(data.covered ?? []));
    })();
  }, [shareId]);

  const workflow = WORKFLOWS[current] ?? null;
  const resolved = (id: string) => covered.has(id) || skipped.has(id);
  const remaining = WORKFLOWS.filter((w) => !resolved(w.id)).length;

  const advance = () => {
    setAnswers({});
    const next = WORKFLOWS.findIndex((w, i) => i > current && !resolved(w.id));
    if (next >= 0) setCurrent(next);
    else {
      const any = WORKFLOWS.findIndex((w) => !resolved(w.id));
      setCurrent(any >= 0 ? any : current);
    }
  };

  const submitWorkflow = async () => {
    if (!token || !workflow) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assess-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_workflow", token, workflowId: workflow.id, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not save");
      setCovered((prev) => new Set([...prev, workflow.id]));
      advance();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assess-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not finish");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#0B3049]">
      <main className="mx-auto flex min-h-screen w-full max-w-[680px] flex-col px-5 py-10 md:py-16">
        <Link href="/" className="mb-10 font-serif text-2xl lowercase text-[#0B3049]">
          hrs
        </Link>

        {done ? (
          <section className="my-auto text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF2E4]">
              <span aria-hidden className="material-symbols-outlined text-[28px] text-[#16a34a]">
                mark_email_read
              </span>
            </div>
            <h1 className="mb-2 text-[28px] font-bold tracking-[-0.02em]">
              Full Assessment submitted
            </h1>
            <p className="mx-auto max-w-[420px] text-[15px] leading-[1.6] text-[#476582]">
              Your report — all six workflows, up to three priority changes and
              the four-day plan — lands in your inbox within 24 hours, with
              your strategy-call booking link.
            </p>
          </section>
        ) : !token ? (
          <p className="my-auto text-center text-[15px] text-[#476582]">
            {error ?? "Loading…"}
          </p>
        ) : workflow ? (
          <section>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-[#16a34a]">
              Full Assessment — {WORKFLOWS.length - remaining} of {WORKFLOWS.length} workflows covered
            </p>
            <h1 className="mb-1 text-[26px] font-bold leading-tight tracking-[-0.02em]">
              {workflow.label}
            </h1>
            <p className="mb-8 text-[14px] leading-snug text-[#6B8199]">{workflow.covers}</p>

            {covered.has(workflow.id) ? (
              <div className="rounded-2xl border border-[#16a34a]/40 bg-[#DDF2E4]/40 p-5 text-[14px] leading-[1.6] text-[#15803d]">
                Covered — carried over from your free assessment. Answer again
                below only if things have changed.
              </div>
            ) : null}

            <div className="mt-6">
              <WorkflowQuestions
                workflow={workflow}
                answers={answers}
                onChange={(k, v) => setAnswers((prev) => ({ ...prev, [k]: v }))}
              />
            </div>

            <button
              type="button"
              onClick={submitWorkflow}
              disabled={busy || !(answers.process as string)?.trim()}
              className="mt-8 w-full rounded-full bg-[#16a34a] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save & next workflow"}
            </button>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSkipped((prev) => new Set([...prev, workflow.id]));
                  advance();
                }}
                className="text-[13px] font-medium text-[#6B8199] hover:text-[#0B3049]"
              >
                {covered.has(workflow.id) ? "Keep earlier answers" : "Nothing to add — skip"}
              </button>
              <button
                type="button"
                onClick={finish}
                disabled={busy || covered.size === 0}
                className="text-[13px] font-semibold text-[#16a34a] underline disabled:opacity-40"
              >
                Finish and generate my report
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {WORKFLOWS.map((w, i) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setAnswers({});
                    setCurrent(i);
                  }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                    i === current
                      ? "bg-[#0B3049] text-white"
                      : resolved(w.id)
                        ? "bg-[#DDF2E4] text-[#15803d]"
                        : "bg-[#0B3049]/5 text-[#476582]"
                  }`}
                >
                  {w.label.split(" ")[0]}
                </button>
              ))}
            </div>
            {error && <p className="mt-4 text-[13px] text-[#C2402A]">{error}</p>}
          </section>
        ) : null}
      </main>
    </div>
  );
}
