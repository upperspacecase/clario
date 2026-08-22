// One-page free assessment render (PRD §9.1). Light surface matching the
// homepage. Every number is labelled with its source and confidence.

import type { EngineRecommendation, HoursRange } from "@/lib/assessment-schema";

export interface FreeReportData {
  shareId: string;
  clientName: string;
  businessName: string;
  workflowLabel: string;
  statedOutcome: string | null;
  currentTimeRange: HoursRange | null;
  recommendation: EngineRecommendation;
  nextSteps: string[];
  generatedAt: string | null;
}

const DISPOSITION_LABEL: Record<EngineRecommendation["disposition"], string> = {
  keep_human: "Keep human",
  automate: "Automate",
  ai: "Use AI",
  hand_off: "Hand off",
  stop: "Stop doing this",
};

export const FreeReport: React.FC<{ data: FreeReportData }> = ({ data }) => {
  const r = data.recommendation;
  const fmtUsd = (n: number) => `$${n.toLocaleString("en-US")}`;

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#0B3049]">
      <main className="mx-auto w-full max-w-[760px] px-5 py-12 md:py-16">
        <header className="mb-10">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-serif text-2xl lowercase">hrs</span>
            <span className="rounded-full bg-[#0B3049]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#476582]">
              Free assessment
            </span>
          </div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-[#16a34a]">
            {data.businessName || data.clientName}
            {data.generatedAt ? ` — ${data.generatedAt}` : ""}
          </p>
          <h1 className="text-[clamp(28px,5vw,40px)] font-bold leading-[1.1] tracking-[-0.02em]">
            {data.workflowLabel}
          </h1>
          {data.statedOutcome && (
            <p className="mt-3 text-[15px] leading-[1.6] text-[#476582]">
              Your stated outcome: &ldquo;{data.statedOutcome}&rdquo;
            </p>
          )}
        </header>

        <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[#6B8199]">
              Current time — your estimate
            </div>
            <div className="mt-1 text-[28px] font-bold">
              {data.currentTimeRange
                ? `${data.currentTimeRange.minHoursPerWeek}–${data.currentTimeRange.maxHoursPerWeek} hrs`
                : "Unsure"}
              <span className="text-[14px] font-medium text-[#6B8199]"> / week</span>
            </div>
          </div>
          <div className="rounded-2xl bg-[#DDF2E4] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[#15803d]">
              Recoverable — estimate
            </div>
            <div className="mt-1 text-[28px] font-bold text-[#15803d]">
              {r.impact.recoverableRange.minHoursPerWeek}–{r.impact.recoverableRange.maxHoursPerWeek} hrs
              <span className="text-[14px] font-medium text-[#15803d]/70"> / week</span>
            </div>
            <div className="mt-1 text-[13px] font-semibold text-[#15803d]">
              {fmtUsd(r.impact.annualValueRange.minUsd)}–{fmtUsd(r.impact.annualValueRange.maxUsd)} / year
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[24px] border border-[#0B3049]/8 bg-white p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#16a34a] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              {DISPOSITION_LABEL[r.disposition]}
            </span>
            <span className="rounded-full bg-[#0B3049]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#476582]">
              {r.confidence.level} confidence
            </span>
          </div>
          <h2 className="mb-1 text-lg font-bold">{r.taskLabel}</h2>
          <p className="mb-4 text-[14px] leading-[1.6] text-[#6B8199]">{r.currentState}</p>
          <p className="text-[15px] leading-[1.7]">{r.recommendation}</p>
          {r.toolOrApproach && (
            <p className="mt-3 text-[14px]">
              <span className="font-semibold">Tool or approach:</span> {r.toolOrApproach}
              {r.cost.recurringMonthlyUsd != null && (
                <span className="text-[#6B8199]"> — around {fmtUsd(r.cost.recurringMonthlyUsd)}/month</span>
              )}
            </p>
          )}

          {r.setupSteps.length > 0 && (
            <ol className="mt-5 space-y-2 border-t border-[#0B3049]/8 pt-5">
              {r.setupSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.5]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B3049]/5 text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {r.evidence.customerQuotes.length > 0 && (
          <section className="mb-8">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#6B8199]">
              In your words
            </h3>
            <div className="flex flex-col gap-2">
              {r.evidence.customerQuotes.map((q) => (
                <blockquote
                  key={q}
                  className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[14px] italic leading-snug text-[#0B3049]/80"
                >
                  &ldquo;{q}&rdquo;
                </blockquote>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8 rounded-[24px] bg-white p-7">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#6B8199]">
            This week
          </h3>
          <ul className="space-y-2.5">
            {data.nextSteps.map((s) => (
              <li key={s} className="flex items-start gap-3 text-[14px]">
                <span aria-hidden className="material-symbols-outlined text-lg text-[#16a34a]">
                  check
                </span>
                {s}
              </li>
            ))}
          </ul>
          {r.agentPrompt && (
            <details className="mt-5 border-t border-[#0B3049]/8 pt-4">
              <summary className="cursor-pointer text-[13px] font-semibold text-[#16a34a]">
                Agent-ready prompt — paste into the AI tool you use
              </summary>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-[#F6F4EF] p-4 text-[12.5px] leading-[1.6]">
                {r.agentPrompt}
              </pre>
            </details>
          )}
        </section>

        <p className="mb-10 text-[12px] leading-[1.6] text-[#6B8199]">
          Estimates assume {r.assumptions.workingWeeksPerYear} working weeks per
          year and a {`$${r.assumptions.loadedHourlyCostUsd}`}/hr loaded cost,
          based on your answers alone — no external benchmark was applied.
          Confidence: {r.confidence.level} ({r.confidence.reason}).{" "}
          <a
            href={`/api/reports/${data.shareId}/markdown`}
            className="font-semibold text-[#16a34a] underline"
          >
            Download as Markdown
          </a>
        </p>

        <section className="rounded-[24px] border-2 border-[#16a34a] bg-white p-8 text-center">
          <h3 className="mb-2 text-xl font-bold">Want the whole operation mapped?</h3>
          <p className="mx-auto mb-5 max-w-[440px] text-[14px] leading-[1.6] text-[#476582]">
            The Full Assessment covers all six workflows, selects up to three
            priority changes, and includes a 30-minute strategy call. $497,
            delivered within 24 hours — backed by the $10,000 guarantee.
          </p>
          <a
            href="/#pricing"
            className="inline-block rounded-full bg-[#16a34a] px-8 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#15803d]"
          >
            Get the Full Assessment
          </a>
        </section>
      </main>
    </div>
  );
};
