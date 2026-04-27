export const SampleReport: React.FC = () => {
  return (
    <section
      id="sample-report"
      className="relative overflow-hidden border-t border-outline-variant/30 bg-background py-[64px] text-on-background md:py-[120px]"
    >
      <div className="relative z-10 mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <h2 className="mb-6 font-serif text-[clamp(28px,5vw,40px)] leading-[1.2] text-on-surface">
            See what your report looks like
          </h2>
          <p className="font-[Inter] text-lg leading-[1.6] text-on-surface-variant">
            Your <em className="not-italic font-semibold text-on-surface">hrs</em>{" "}
            report shows where time is being lost today, which workflows are
            most worth improving first, what tools fit best, and what to do
            next. It is designed to be clear enough to act on immediately,
            without needing a full consulting engagement.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl rounded-lg border border-outline-variant bg-surface p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sm:p-8 md:p-12">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant pb-6 sm:pb-8 md:mb-10">
            <div>
              <span className="mb-2 block font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-outline">
                Diagnostic Result
              </span>
              <h3 className="font-serif text-2xl text-on-surface">
                Acme Studio Ops
              </h3>
            </div>
            <div className="text-right">
              <span className="mb-1 block font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-outline">
                Friction Score
              </span>
              <span className="font-serif text-3xl text-primary">High</span>
            </div>
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {/* Current time leaks */}
            <Section label="Current time leaks">
              <Leak
                color="bg-error"
                title="Context switching"
                body="4.2 hrs/wk lost moving between Slack, Asana, and email."
              />
              <Leak
                color="bg-primary-container"
                title="Redundant data entry"
                body="Invoicing requires manual transcription from the CRM."
              />
              <Leak
                color="bg-tertiary"
                title="Meeting bloat"
                body="Daily standups average 25 mins (target: 10)."
                noBorder
              />
            </Section>

            {/* Highest-impact AI opportunities */}
            <Section label="Highest-impact AI opportunities">
              <Opportunity
                title="Auto-summarise client check-ins"
                body="Weekly meeting notes drafted directly from recordings."
              />
              <Opportunity
                title="Triage inbound enquiries"
                body="Classify and route new leads before standup."
              />
              <Opportunity
                title="Bridge CRM to invoicing"
                body="Eliminate dual entry between sales and finance tools."
                noBorder
              />
            </Section>

            {/* Recommended tools */}
            <Section label="Recommended tools">
              <div className="flex flex-wrap gap-2">
                <Chip>Granola</Chip>
                <Chip>Zapier</Chip>
                <Chip>Fathom</Chip>
                <Chip>ChatGPT Team</Chip>
              </div>
              <p className="mt-3 font-[Inter] text-sm leading-[1.6] text-on-surface-variant">
                Picked to fit your existing stack — no rip-and-replace.
              </p>
            </Section>

            {/* Estimated time saved */}
            <Section label="Estimated time saved">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl leading-none text-primary">
                  36
                </span>
                <span className="font-[Inter] text-sm font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  hrs / week
                </span>
              </div>
              <p className="mt-3 font-[Inter] text-sm leading-[1.6] text-on-surface-variant">
                Across the team — based on your inputs and the leaks above.
              </p>
            </Section>
          </div>

          {/* 30-day next steps — full width */}
          <div className="mt-10 border-t border-outline-variant pt-8">
            <Section label="30-day next steps">
              <div className="grid grid-cols-1 gap-4 rounded border border-outline-variant/50 bg-surface-container-low p-6 md:grid-cols-3">
                <Directive body="Implement async check-ins via shared doc on Tuesdays and Thursdays." />
                <Directive body="Connect CRM to invoicing via Zapier — about 45 mins of setup." />
                <Directive body="Reserve 9–11am as company-wide deep-work blocks." />
              </div>
            </Section>

            <div className="mt-6 text-right">
              <a
                href="#"
                className="inline-flex items-center gap-1 font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-primary transition-colors hover:text-primary-container"
              >
                View Full Sample PDF
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <h4 className="mb-5 font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-on-surface">
      {label}
    </h4>
    <div className="space-y-4">{children}</div>
  </div>
);

const Leak: React.FC<{
  color: string;
  title: string;
  body: string;
  noBorder?: boolean;
}> = ({ color, title, body, noBorder }) => (
  <div
    className={
      "flex items-start gap-4 " +
      (noBorder ? "" : "border-b border-outline-variant/50 pb-4")
    }
  >
    <div className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${color}`} />
    <div>
      <div className="mb-1 font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-on-surface">
        {title}
      </div>
      <div className="font-[Inter] text-sm leading-[1.6] text-on-surface-variant">
        {body}
      </div>
    </div>
  </div>
);

const Opportunity: React.FC<{
  title: string;
  body: string;
  noBorder?: boolean;
}> = ({ title, body, noBorder }) => (
  <div
    className={
      "flex items-start gap-3 " +
      (noBorder ? "" : "border-b border-outline-variant/50 pb-4")
    }
  >
    <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">
      bolt
    </span>
    <div>
      <div className="mb-1 font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-on-surface">
        {title}
      </div>
      <div className="font-[Inter] text-sm leading-[1.6] text-on-surface-variant">
        {body}
      </div>
    </div>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded border border-outline-variant bg-surface-container-low px-3 py-1.5 font-[Inter] text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface">
    {children}
  </span>
);

const Directive: React.FC<{ body: string }> = ({ body }) => (
  <div className="flex gap-3">
    <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">
      check_circle
    </span>
    <p className="font-[Inter] text-sm leading-[1.6] text-on-surface-variant">
      {body}
    </p>
  </div>
);
