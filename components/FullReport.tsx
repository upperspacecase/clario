// Full Assessment render (PRD §9.2): workflow map, task map, tools, four-day
// plan — four screens of one page, same honesty labels as the free report.

import type { EngineRecommendation, HoursRange } from "@/lib/assessment-schema";
import { BookingPicker } from "./BookingPicker";

export interface FullReportData {
  shareId: string;
  assessmentId: string;
  clientName: string;
  clientEmail: string;
  businessName: string;
  executiveSummary: string;
  workflowMap: {
    workflowId: string;
    label: string;
    summary: string;
    timeRange: HoursRange | null;
    opportunity: "high" | "medium" | "low" | "unknown";
  }[];
  focusWorkflowIds: string[];
  recommendations: EngineRecommendation[];
  fourDayPlan: { day: number; action: string; owner: string; timeRequired: string; test: string }[];
  guaranteeTotalUsd: number;
  generatedAt: string | null;
}

const OPPORTUNITY_STYLE: Record<string, string> = {
  high: "bg-[#DDF2E4] text-[#15803d]",
  medium: "bg-[#FBE7DA] text-[#B4530A]",
  low: "bg-[#0B3049]/5 text-[#476582]",
  unknown: "bg-[#0B3049]/5 text-[#6B8199]",
};

const DISPOSITION_LABEL: Record<EngineRecommendation["disposition"], string> = {
  keep_human: "Keep human",
  automate: "Automate",
  ai: "Use AI",
  hand_off: "Hand off",
  stop: "Stop doing this",
};

const fmtUsd = (n: number) => `$${n.toLocaleString("en-US")}`;

export const FullReport: React.FC<{ data: FullReportData }> = ({ data }) => {
  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#0B3049]">
      <main className="mx-auto w-full max-w-[820px] px-5 py-12 md:py-16">
        <header className="mb-10">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-serif text-2xl lowercase">hrs</span>
            <span className="rounded-full bg-[#16a34a] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              Full assessment
            </span>
          </div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-[#16a34a]">
            {data.businessName || data.clientName}
            {data.generatedAt ? ` — ${data.generatedAt}` : ""}
          </p>
          <p className="max-w-[620px] text-[17px] leading-[1.65]">{data.executiveSummary}</p>
        </header>

        {/* Page 1: workflow map */}
        <SectionTitle n={1} title="Workflow map" sub="Where the operation's time goes today" />
        <div className="mb-12 overflow-hidden rounded-[24px] border border-[#0B3049]/8 bg-white">
          {data.workflowMap.map((w, i) => (
            <div
              key={w.workflowId}
              className={`flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-4 ${i > 0 ? "border-t border-[#0B3049]/6" : ""} ${data.focusWorkflowIds.includes(w.workflowId) ? "bg-[#DDF2E4]/30" : ""}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold">{w.label}</span>
                  {data.focusWorkflowIds.includes(w.workflowId) && (
                    <span className="rounded-full bg-[#16a34a] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                      Focus
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-snug text-[#476582]">{w.summary}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[13px] font-semibold text-[#476582]">
                  {w.timeRange
                    ? `${w.timeRange.minHoursPerWeek}–${w.timeRange.maxHoursPerWeek} hrs/wk`
                    : "time unknown"}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${OPPORTUNITY_STYLE[w.opportunity]}`}>
                  {w.opportunity}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Page 2+3: priorities (task map + tools together per recommendation) */}
        <SectionTitle n={2} title="Priority changes" sub={`${data.recommendations.length} ${data.recommendations.length === 1 ? "change" : "changes"}, ordered — never more than three`} />
        <div className="mb-12 flex flex-col gap-5">
          {data.recommendations.map((r, i) => (
            <article key={r.id} className="rounded-[24px] border border-[#0B3049]/8 bg-white p-7">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B3049] text-[13px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="rounded-full bg-[#16a34a] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  {DISPOSITION_LABEL[r.disposition]}
                </span>
                <span className="rounded-full bg-[#0B3049]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#476582]">
                  {r.confidence.level} confidence
                </span>
              </div>
              <h3 className="mb-1 text-lg font-bold">{r.taskLabel}</h3>
              <p className="mb-3 text-[13.5px] leading-snug text-[#6B8199]">{r.currentState}</p>
              <p className="text-[15px] leading-[1.7]">{r.recommendation}</p>
              {r.toolOrApproach && (
                <p className="mt-3 text-[14px]">
                  <span className="font-semibold">Tool or approach:</span> {r.toolOrApproach}
                  {r.cost.recurringMonthlyUsd != null && (
                    <span className="text-[#6B8199]"> — around {fmtUsd(r.cost.recurringMonthlyUsd)}/month</span>
                  )}
                </p>
              )}
              <p className="mt-3 text-[14px] font-semibold text-[#15803d]">
                {r.impact.recoverableRange.minHoursPerWeek}–{r.impact.recoverableRange.maxHoursPerWeek} hrs/week ≈{" "}
                {fmtUsd(r.impact.annualValueRange.minUsd)}–{fmtUsd(r.impact.annualValueRange.maxUsd)}/year
              </p>
              {r.setupSteps.length > 0 && (
                <ol className="mt-4 space-y-2 border-t border-[#0B3049]/8 pt-4">
                  {r.setupSteps.map((s, j) => (
                    <li key={j} className="flex items-start gap-3 text-[14px] leading-[1.5]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B3049]/5 text-[11px] font-bold">
                        {j + 1}
                      </span>
                      <span className="pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
              )}
              {r.agentPrompt && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-[13px] font-semibold text-[#16a34a]">
                    Agent-ready prompt
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-[#F6F4EF] p-4 text-[12.5px] leading-[1.6]">
                    {r.agentPrompt}
                  </pre>
                </details>
              )}
            </article>
          ))}
        </div>

        {/* Page 4: four-day plan */}
        <SectionTitle n={3} title="Four-day plan" sub="Immediate movement, owner and test for each step" />
        <div className="mb-10 overflow-hidden rounded-[24px] border border-[#0B3049]/8 bg-white">
          {data.fourDayPlan.map((p, i) => (
            <div key={i} className={`flex items-start gap-4 p-5 ${i > 0 ? "border-t border-[#0B3049]/6" : ""}`}>
              <span className="mt-0.5 shrink-0 rounded-lg bg-[#0B3049]/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#476582]">
                Day {p.day}
              </span>
              <div>
                <p className="text-[14.5px] font-semibold leading-snug">{p.action}</p>
                <p className="mt-1 text-[12.5px] text-[#6B8199]">
                  {p.owner} · {p.timeRequired} · Success: {p.test}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mb-10 text-[12px] leading-[1.6] text-[#6B8199]">
          Estimated recoverable value across priorities: ~{fmtUsd(data.guaranteeTotalUsd)}/year
          (midpoints; assumes 46 working weeks and $60/hr loaded cost — from your
          answers alone, no external benchmark applied).{" "}
          <a href={`/api/reports/${data.shareId}/markdown`} className="font-semibold text-[#16a34a] underline">
            Download as Markdown
          </a>{" "}
          — paste it into the AI tool you use, together with the agent prompts above.
        </p>

        <BookingPicker
          shareId={data.shareId}
          assessmentId={data.assessmentId}
          clientName={data.clientName}
          clientEmail={data.clientEmail}
        />
      </main>
    </div>
  );
};

const SectionTitle: React.FC<{ n: number; title: string; sub: string }> = ({ n, title, sub }) => (
  <div className="mb-5">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#16a34a]">
      Part {n}
    </p>
    <h2 className="text-[22px] font-bold tracking-[-0.01em]">{title}</h2>
    <p className="text-[13px] text-[#6B8199]">{sub}</p>
  </div>
);
