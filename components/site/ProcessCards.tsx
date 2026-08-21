// The Calendly-style process strip: four cards in a row, the hovered card
// grows and reveals its detail timeline + a small visual. With nothing
// hovered, the first card holds the expanded state (see .process-cards rules
// in globals.css). On mobile the cards stack, fully expanded.

type Step = {
  title: string;
  tagline: string;
  bullets: { icon: string; text: string }[];
  wash: string; // gradient wash behind the visual
  visual: React.ReactNode;
};

const STEPS: Step[] = [
  {
    title: "Call",
    tagline: "Leave your details and your phone rings.",
    bullets: [
      { icon: "edit_note", text: "Five fields, no scheduling" },
      { icon: "call", text: "Sam rings you straight away" },
      { icon: "waving_hand", text: "Pick up and say hello" },
    ],
    wash: "linear-gradient(180deg, rgba(220,233,247,0) 0%, #DCE9F7 90%)",
    visual: <CallVisual />,
  },
  {
    title: "Talk",
    tagline: "A conversation about where your week goes.",
    bullets: [
      { icon: "hearing", text: "Sam listens more than he talks" },
      { icon: "schedule", text: "You set the length — twenty minutes or an hour" },
      { icon: "back_hand", text: "Say the word and Sam wraps up" },
    ],
    wash: "linear-gradient(180deg, rgba(221,242,228,0) 0%, #DDF2E4 90%)",
    visual: <TalkVisual />,
  },
  {
    title: "Report",
    tagline: "Your Hours Report lands within 24 hours.",
    bullets: [
      { icon: "search_insights", text: "Where your hours leak, quantified" },
      { icon: "construction", text: "A verified tool shortlist for your stack" },
      { icon: "event_available", text: "A 4-day quick-win install plan" },
    ],
    wash: "linear-gradient(180deg, rgba(231,227,249,0) 0%, #E7E3F9 90%)",
    visual: <ReportVisual />,
  },
  {
    title: "Act",
    tagline: "Get the hours back.",
    bullets: [
      { icon: "co_present", text: "Free walkthrough of your report" },
      { icon: "bolt", text: "Quick wins installed inside a week" },
      { icon: "verified", text: "Backed by the 10× ROI guarantee" },
    ],
    wash: "linear-gradient(180deg, rgba(251,231,218,0) 0%, #FBE7DA 90%)",
    visual: <ActVisual />,
  },
];

export const ProcessCards: React.FC = () => {
  return (
    <section className="py-[80px] md:py-[120px]">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-12 max-w-2xl md:mb-16">
          <span className="mb-4 block text-[13px] font-semibold uppercase tracking-widest text-[#16a34a]">
            How it works
          </span>
          <h2 className="text-[clamp(28px,4.5vw,44px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#0B3049]">
            One phone call, handled end to end
          </h2>
          <p className="mt-4 text-base leading-[1.6] text-[#476582] md:text-lg">
            Sam handles the conversation, the analysis, and the plan. You handle
            picking up the phone.
          </p>
        </div>

        <div className="process-cards flex flex-col gap-4 md:h-[560px] md:flex-row">
          {STEPS.map((step) => (
            <article
              key={step.title}
              tabIndex={0}
              className="process-card group relative flex flex-col overflow-hidden rounded-[28px] border border-[#0B3049]/6 bg-white p-7 transition-[flex-grow] duration-500 ease-out md:min-w-0 md:basis-0"
            >
              <h3 className="text-[26px] font-bold tracking-[-0.01em] text-[#0B3049]">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[300px] text-[15px] leading-snug text-[#476582]">
                {step.tagline}
              </p>

              <div className="card-details mt-6 flex min-h-0 flex-1 flex-col md:opacity-0 md:transition-opacity md:duration-300 md:group-hover:opacity-100 md:group-hover:delay-150 md:group-focus-within:opacity-100">
                <ul className="space-y-0">
                  {step.bullets.map((b, i) => (
                    <li key={b.text} className="relative flex items-start gap-3 pb-4">
                      {i < step.bullets.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-px bg-[#0B3049]/10"
                        />
                      )}
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B3049]/5">
                        <span aria-hidden className="material-symbols-outlined text-[18px] text-[#0B3049]">
                          {b.icon}
                        </span>
                      </span>
                      <span className="pt-1.5 text-[14px] leading-snug text-[#0B3049]/80">
                        {b.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="relative mt-auto min-h-[150px] pt-6">
                  <div className="relative z-10">{step.visual}</div>
                </div>
              </div>

              <div
                aria-hidden
                className="card-wash pointer-events-none absolute inset-x-0 bottom-0 h-1/2 md:opacity-0 md:transition-opacity md:duration-500 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                style={{ background: step.wash }}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

// ---- Miniature visuals, pure markup ----

function CallVisual() {
  return (
    <div className="mx-auto w-full max-w-[240px] rounded-2xl border border-[#0B3049]/8 bg-white p-4 shadow-[0_16px_40px_-24px_rgba(11,48,73,0.35)]">
      <div className="mb-2 h-2.5 w-2/3 rounded-full bg-[#0B3049]/10" />
      <div className="mb-2 h-8 rounded-lg bg-[#F1F0EC]" />
      <div className="mb-3 h-8 rounded-lg bg-[#F1F0EC]" />
      <div className="flex h-9 items-center justify-center rounded-full bg-[#16a34a] text-[12px] font-semibold text-white">
        Call me now
      </div>
    </div>
  );
}

function TalkVisual() {
  return (
    <div className="mx-auto flex w-full max-w-[260px] flex-col gap-2">
      <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-[12.5px] leading-snug text-[#0B3049] shadow-[0_10px_28px_-18px_rgba(11,48,73,0.4)]">
        Where does the week go first?
      </div>
      <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-[#16a34a] px-3.5 py-2 text-[12.5px] leading-snug text-white shadow-[0_10px_28px_-18px_rgba(22,163,74,0.5)]">
        Chasing paperwork, honestly.
      </div>
      <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-[12.5px] leading-snug text-[#0B3049] shadow-[0_10px_28px_-18px_rgba(11,48,73,0.4)]">
        Walk me through the last time that happened.
      </div>
    </div>
  );
}

function ReportVisual() {
  return (
    <div className="mx-auto w-full max-w-[240px] rounded-2xl border border-[#0B3049]/8 bg-white p-4 shadow-[0_16px_40px_-24px_rgba(11,48,73,0.35)]">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#476582]">
        Hours found
      </div>
      <div className="mb-3 text-[22px] font-bold leading-none text-[#0B3049]">
        11 hrs<span className="text-[13px] font-semibold text-[#476582]"> / week</span>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-[90%] rounded-full bg-[#16a34a]" />
        <div className="h-2.5 w-[65%] rounded-full bg-[#16a34a]/70" />
        <div className="h-2.5 w-[40%] rounded-full bg-[#16a34a]/40" />
      </div>
      <div className="mt-3 text-[12px] font-semibold text-[#0B3049]">
        $27,000<span className="font-normal text-[#476582]"> recoverable / year</span>
      </div>
    </div>
  );
}

function ActVisual() {
  const rows = ["Inbox triage automated", "Follow-ups on autopilot", "Reporting in one click"];
  return (
    <div className="mx-auto w-full max-w-[240px] space-y-2">
      {rows.map((r) => (
        <div
          key={r}
          className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 shadow-[0_10px_28px_-18px_rgba(11,48,73,0.35)]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16a34a]">
            <span aria-hidden className="material-symbols-outlined text-[14px] text-white">
              check
            </span>
          </span>
          <span className="text-[12.5px] font-medium text-[#0B3049]">{r}</span>
        </div>
      ))}
    </div>
  );
}
