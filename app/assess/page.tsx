"use client";

// Written free-assessment intake (PRD §6.1, §7.3). Three screens: about you,
// pick the workflow, five questions. Draft answers autosave against the
// emailed resume token so stepping away costs nothing.

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WORKFLOWS, type WorkflowDef } from "@/lib/taxonomy";
import { WorkflowQuestions } from "@/components/WorkflowQuestions";
import { PROMISES } from "@/lib/promises";

type Screen = "about" | "workflow" | "questions" | "done";
type Answers = Record<string, string | boolean>;

export default function AssessPage() {
  return (
    <Suspense fallback={null}>
      <AssessInner />
    </Suspense>
  );
}

function AssessInner() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");

  const [screen, setScreen] = useState<Screen>("about");
  const [token, setToken] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [teamSize, setTeamSize] = useState("5-15");
  const [workflow, setWorkflow] = useState<WorkflowDef | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resumedRef = useRef(false);

  // Emailed resume link: restore the draft and jump past "about".
  useEffect(() => {
    if (!urlToken || resumedRef.current) return;
    resumedRef.current = true;
    void (async () => {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume", token: urlToken }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status !== "intake_started") {
        setScreen("done");
        return;
      }
      setToken(urlToken);
      setFirstName(data.firstName ?? "");
      const draftWorkflow = WORKFLOWS.find((w) => w.id === data.draft?.workflowId) ?? null;
      setWorkflow(draftWorkflow);
      setAnswers((data.draft?.answers as Answers) ?? {});
      setScreen(draftWorkflow ? "questions" : "workflow");
    })();
  }, [urlToken]);

  const saveDraft = useCallback(
    (nextWorkflow: WorkflowDef | null, nextAnswers: Answers) => {
      if (!token) return;
      void fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          token,
          workflowId: nextWorkflow?.id ?? null,
          answers: nextAnswers,
        }),
      });
    },
    [token],
  );

  const startAssessment = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          firstName,
          businessName,
          email,
          country: country.toUpperCase(),
          teamSize,
          currency: "USD",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not start");
      setToken(data.token);
      setScreen("workflow");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!token || !workflow) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", token, workflowId: workflow.id, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not submit");
      setScreen("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const canStart =
    firstName.trim() && businessName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#0B3049]">
      <main className="mx-auto flex min-h-screen w-full max-w-[680px] flex-col px-5 py-10 md:py-16">
        <Link href="/" className="mb-10 font-serif text-2xl lowercase text-[#0B3049]">
          hrs
        </Link>

        {screen === "about" && (
          <section>
            <StepTag n={1} total={3} label="About your team" />
            <h1 className="mb-2 text-[28px] font-bold leading-tight tracking-[-0.02em]">
              Your free assessment, in writing
            </h1>
            <p className="mb-8 text-[15px] leading-[1.6] text-[#476582]">
              Five questions on the workflow you choose. {PROMISES.freeSlaSentence}{" "}
              Prefer to talk it through instead?{" "}
              <Link href="/#call" className="font-semibold text-[#16a34a] underline">
                Get a call from Sam
              </Link>
              .
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
              <Input label="Business or team name" value={businessName} onChange={setBusinessName} autoComplete="organization" />
              <Input label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@acme.co" />
              <Input label="Country" value={country} onChange={setCountry} autoComplete="country" placeholder="e.g. NZ, US, GB" maxLength={2} />
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#476582]">
                  Team size
                </span>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="h-11 rounded-xl border border-[#0B3049]/12 bg-white px-3.5 text-[15px] focus:border-[#16a34a] focus:outline-none"
                >
                  <option value="1-4">1–4 people</option>
                  <option value="5-15">5–15 people</option>
                  <option value="16+">16 or more</option>
                </select>
              </label>
            </div>
            <p className="mt-4 text-[12.5px] leading-snug text-[#6B8199]">
              By continuing you agree that Hours may store your answers and
              email you the assessment report.
            </p>
            <PrimaryButton onClick={startAssessment} disabled={!canStart || busy}>
              {busy ? "Starting…" : "Continue"}
            </PrimaryButton>
          </section>
        )}

        {screen === "workflow" && (
          <section>
            <StepTag n={2} total={3} label="Pick one workflow" />
            <h1 className="mb-2 text-[28px] font-bold leading-tight tracking-[-0.02em]">
              Where does the week hurt most?
            </h1>
            <p className="mb-8 text-[15px] leading-[1.6] text-[#476582]">
              The free assessment goes deep on one workflow — pick the one
              costing you most. The Full Assessment covers all six.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {WORKFLOWS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setWorkflow(w);
                    saveDraft(w, answers);
                    setScreen("questions");
                  }}
                  className="rounded-2xl border border-[#0B3049]/10 bg-white p-5 text-left transition-colors hover:border-[#16a34a] hover:bg-white focus:border-[#16a34a] focus:outline-none"
                >
                  <div className="text-[15px] font-bold">{w.label}</div>
                  <div className="mt-1 text-[12.5px] leading-snug text-[#6B8199]">{w.covers}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {screen === "questions" && workflow && (
          <section>
            <StepTag n={3} total={3} label={workflow.label} />
            <h1 className="mb-8 text-[28px] font-bold leading-tight tracking-[-0.02em]">
              Five questions, plain answers
            </h1>
            <WorkflowQuestions workflow={workflow} answers={answers} onChange={update} />
            <PrimaryButton
              onClick={submit}
              disabled={busy || !(answers.process as string)?.trim()}
            >
              {busy ? "Submitting…" : "Get my assessment"}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setScreen("workflow")}
              className="mt-3 w-full text-center text-[13px] font-medium text-[#6B8199] hover:text-[#0B3049]"
            >
              Pick a different workflow
            </button>
          </section>
        )}

        {screen === "done" && (
          <section className="my-auto text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF2E4]">
              <span aria-hidden className="material-symbols-outlined text-[28px] text-[#16a34a]">
                mark_email_read
              </span>
            </div>
            <h1 className="mb-2 text-[28px] font-bold tracking-[-0.02em]">
              That&apos;s everything we need
            </h1>
            <p className="mx-auto max-w-[400px] text-[15px] leading-[1.6] text-[#476582]">
              {PROMISES.freeSlaSentence} If anything needs clarifying we&apos;ll
              reply to your email first.
            </p>
          </section>
        )}

        {error && <p className="mt-4 text-[13px] text-[#C2402A]">{error}</p>}
      </main>
    </div>
  );

  function update(key: string, value: string | boolean) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    saveDraft(workflow, next);
  }
}

const StepTag: React.FC<{ n: number; total: number; label: string }> = ({ n, total, label }) => (
  <p className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-[#16a34a]">
    Step {n} of {total} — {label}
  </p>
);

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
}> = ({ label, value, onChange, type = "text", autoComplete, placeholder, maxLength }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#476582]">
      {label}
    </span>
    <input
      type={type}
      value={value}
      autoComplete={autoComplete}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 rounded-xl border border-[#0B3049]/12 bg-white px-3.5 text-[15px] placeholder:text-[#0B3049]/30 focus:border-[#16a34a] focus:outline-none"
    />
  </label>
);

const PrimaryButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="mt-8 w-full rounded-full bg-[#16a34a] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
);
