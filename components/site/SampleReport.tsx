export const SampleReport: React.FC = () => {
  return (
    <section
      id="sample-report"
      className="relative overflow-hidden border-t border-outline-variant/30 bg-background py-[120px] text-on-background"
    >
      <div className="relative z-10 mx-auto max-w-[1120px] px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-6 font-serif text-[40px] leading-[1.2] text-on-surface">
            See what your report looks like.
          </h2>
          <p className="font-[Inter] text-lg leading-[1.6] text-on-surface-variant">
            No bloated consulting decks. Just crisp diagnostics and immediate
            directives delivered in a clean, legible format.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl rounded-lg border border-outline-variant bg-surface p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] md:p-12">
          <div className="mb-8 flex items-end justify-between border-b border-outline-variant pb-8">
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

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <h4 className="mb-6 font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-on-surface">
                Identified Leaks
              </h4>
              <div className="space-y-4">
                <Leak
                  color="bg-error"
                  title="Context Switching"
                  body="4.2 hours/week per team member lost moving between Slack, Asana, and Email."
                />
                <Leak
                  color="bg-primary-container"
                  title="Redundant Data Entry"
                  body="Invoicing workflow requires manual transcription from CRM."
                />
                <Leak
                  color="bg-tertiary"
                  title="Meeting Bloat"
                  body="Daily standups averaging 25 mins instead of target 10 mins."
                  noBorder
                />
              </div>
            </div>

            <div>
              <h4 className="mb-6 font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-on-surface">
                30-Day Directives
              </h4>
              <div className="space-y-4 rounded border border-outline-variant/50 bg-surface-container-low p-6">
                <Directive body="Implement async check-ins via shared document on Tuesdays and Thursdays." />
                <Directive body="Connect CRM to Invoicing tool via Zapier (estimated setup time: 45 mins)." />
                <Directive body="Establish 'Deep Work' blocks: 9am-11am company-wide, zero slack expectations." />
              </div>

              <div className="mt-8 text-right">
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
      </div>
    </section>
  );
};

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
    <div
      className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${color}`}
    />
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

const Directive: React.FC<{ body: string }> = ({ body }) => (
  <div className="flex gap-3">
    <span className="material-symbols-outlined text-[20px] text-primary">
      check_circle
    </span>
    <p className="font-[Inter] text-sm leading-[1.6] text-on-surface-variant">
      {body}
    </p>
  </div>
);
