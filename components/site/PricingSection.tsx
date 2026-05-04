const includes = [
  "12-minute call with Annie, your AI interviewer",
  "Personalized written report, delivered within 24 hours",
  "Verified tool recommendations with pricing and install steps",
  "Effort × Impact matrix so you know where to start",
  "4-day quick-win plan you can hand to your team",
  "30-minute follow-up consult to walk through the report",
];

export const PricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-white/5 bg-[#121212] bg-grain py-[64px] text-surface-container md:py-[120px]"
    >
      <div className="relative z-10 mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-4 font-serif text-[clamp(28px,5vw,44px)] leading-[1.15] tracking-[-0.01em] text-surface-container">
            One audit. One report. A clear path back to your time.
          </h2>
          <p className="mx-auto max-w-2xl font-[Inter] text-base leading-[1.6] text-[#a3a3a3] md:text-lg">
            Most owners we talk to are losing 10 or more hours a week to admin
            and disconnected tools. The Hours Audit finds where, why, and what
            to do about it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-5">
          {/* Offer card — left 3/5 */}
          <div className="bg-[#141414] p-8 sm:p-10 md:col-span-3">
            <p className="mb-3 font-[Inter] text-[12px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
              The Hours Audit
            </p>

            <div className="mb-6 flex items-baseline gap-3">
              <span className="font-serif text-[clamp(48px,7vw,72px)] leading-none tracking-[-0.02em] text-surface-container">
                $1,000
              </span>
              <span className="font-[Inter] text-sm text-[#a3a3a3]">
                one-time · per audit
              </span>
            </div>

            <ul className="mb-8 space-y-3">
              {includes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 font-[Inter] text-[15px] leading-[1.55] text-surface-container/90"
                >
                  <span
                    aria-hidden
                    className="material-symbols-outlined mt-0.5 text-[18px] text-primary-container"
                  >
                    check
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="/#phone"
              className="mb-4 inline-block bg-primary-container px-10 py-4 font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-on-primary-fixed transition-opacity hover:opacity-80"
            >
              Get My Hours Audit
            </a>

            <p className="font-[Inter] text-sm leading-[1.55] text-[#737373]">
              No card required to start. We confirm your call slot first, then
              send a single invoice.
            </p>
          </div>

          {/* Trust column — right 2/5 */}
          <div className="flex flex-col gap-8 bg-[#101010] p-8 sm:p-10 md:col-span-2">
            <div>
              <p className="mb-3 font-[Inter] text-[12px] font-semibold uppercase tracking-[0.18em] text-primary-container/80">
                Our guarantee
              </p>
              <p className="font-serif text-lg leading-[1.4] text-surface-container">
                If your report doesn&apos;t surface at least{" "}
                <span className="text-primary-container">10 hours a week</span>{" "}
                of recoverable time, you pay nothing.
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <p className="mb-3 font-[Inter] text-[12px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                Why we cap it
              </p>
              <p className="font-[Inter] text-[15px] leading-[1.55] text-[#a3a3a3]">
                Every report is personally reviewed before it lands in your
                inbox. We take five audits a week so each one gets the
                attention it deserves.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center font-[Inter] text-sm leading-[1.6] text-[#737373]">
          Use the calculator above with your own numbers. If the audit
          doesn&apos;t pay for itself in the first month, the guarantee covers
          you.
        </p>
      </div>
    </section>
  );
};
