// Representative free-report preview (FR-05). All figures are example data
// and labelled as such — the PRD bans invented testimonials and unsourced
// cohort claims, so this section shows the product instead of borrowed praise.

const NEXT_STEPS = [
  "Turn on missed-call text-back in your phone system",
  "Move new-lead intake to one shared inbox",
  "Run the included agent prompt against your CRM export",
];

export const ReportPreview: React.FC = () => {
  return (
    <section className="py-[80px] md:py-[120px]">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <span className="mb-4 block text-[13px] font-semibold uppercase tracking-widest text-[#16a34a]">
              What you get
            </span>
            <h2 className="text-[clamp(28px,4.5vw,44px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#0B3049]">
              One page. One priority. No homework.
            </h2>
            <p className="mt-4 text-base leading-[1.6] text-[#476582] md:text-lg">
              The free assessment examines the workflow you chose and returns
              one recommendation — with the estimate, the assumptions behind
              it, and how confident we are. Below is a representative example
              with anonymised numbers; yours is built from your call.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Estimates shown as ranges, never false precision",
                "Assumptions spelled out and editable",
                "A recommendation sized to act on this week",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-[#0B3049]/80">
                  <span aria-hidden className="material-symbols-outlined text-lg text-[#16a34a]">
                    check
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-7">
            <div className="relative rounded-[28px] border border-[#0B3049]/8 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(11,48,73,0.25)] md:p-9">
              <div className="absolute right-6 top-6 rounded-full bg-[#0B3049]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#476582]">
                Example report
              </div>

              <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#6B8199]">
                Workflow examined
              </div>
              <h3 className="mb-6 text-xl font-bold text-[#0B3049]">
                Lead generation and follow-up
              </h3>

              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F6F4EF] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[#6B8199]">
                    Current time — your estimate
                  </div>
                  <div className="mt-1 text-2xl font-bold text-[#0B3049]">
                    9–12 hrs<span className="text-sm font-medium text-[#6B8199]"> / week</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#DDF2E4] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[#15803d]">
                    Recoverable — estimate
                  </div>
                  <div className="mt-1 text-2xl font-bold text-[#15803d]">
                    4–6 hrs<span className="text-sm font-medium text-[#15803d]/70"> / week</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-[#0B3049]/8 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-[#16a34a] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    Automate
                  </span>
                  <span className="rounded-full bg-[#0B3049]/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#476582]">
                    Medium confidence
                  </span>
                </div>
                <p className="text-[15px] leading-[1.6] text-[#0B3049]">
                  Auto-draft first-touch and day-three follow-ups from your CRM,
                  reviewed before sending. Estimated value $14–21k per year.
                </p>
                <p className="mt-2 text-[12.5px] leading-snug text-[#6B8199]">
                  Assumes 46 working weeks and a $60/hr loaded cost — both
                  editable in your report.
                </p>
              </div>

              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#6B8199]">
                Next steps
              </div>
              <ul className="mt-3 space-y-2.5">
                {NEXT_STEPS.map((s, i) => (
                  <li key={s} className="flex items-start gap-3 text-[14px] text-[#0B3049]/80">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B3049]/5 text-[11px] font-bold text-[#0B3049]">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
