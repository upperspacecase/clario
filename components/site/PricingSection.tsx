import { PROMISES } from "@/lib/promises";

type Tier = {
  id: "audit" | "install";
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  forWho: string;
  includes: string[];
  cta: string;
  guarantee: string;
  popular?: boolean;
};

const tiers: Tier[] = [
  {
    id: "audit",
    name: "Hours Audit",
    tagline: "The full audit. The plan. A clear path back to your time.",
    price: "$1,000",
    priceNote: "one-time · per audit",
    forWho: "For owners ready to commit and execute the plan themselves.",
    includes: [
      `${PROMISES.callDurationLabel} with Annie, your AI interviewer`,
      `Personalized written report, delivered ${PROMISES.reportSlaLabel}`,
      "Verified tool recommendations with pricing and install steps",
      "Effort × Impact matrix",
      "4-day quick-win plan",
      `Free ${PROMISES.followUpLabel}`,
    ],
    cta: "Get My Hours Audit",
    guarantee:
      "If your report doesn't surface at least 8 hours per week of recoverable time, full refund.",
    popular: true,
  },
  {
    id: "install",
    name: "Hours Install",
    tagline: "Don't just get the plan — get it done with you.",
    price: "$3,500",
    priceNote: "one-time · 30-day engagement",
    forWho: "For owners who want hours back now, not after they self-install.",
    includes: [
      "Everything in the Hours Audit",
      "30-day private Slack channel with Tay",
      "3 done-with-you screen-share install sessions",
      "Week 1, 2, and 4 accountability check-ins",
      "One-page decision-maker brief for your team",
    ],
    cta: "Start the Install",
    guarantee:
      "If you don't recover at least 5 hours per week of working time within 30 days, full refund — and you keep all the install work.",
  },
];

export const PricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-white/5 bg-[#121212] bg-grain py-[64px] text-surface-container md:py-[120px]"
    >
      <div className="relative z-10 mx-auto max-w-[1080px] px-5 md:px-8">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-4 font-serif text-[clamp(28px,5vw,48px)] leading-[1.1] tracking-[-0.02em] text-surface-container">
            Stop being your business&apos;s bottleneck.
          </h2>
          <p className="mx-auto max-w-2xl font-[Inter] text-base leading-[1.6] text-[#a3a3a3] md:text-lg">
            Two ways to get hours back. Pick the one that matches how done you
            want it.
          </p>
        </div>

        <div className="mx-auto grid max-w-[860px] grid-cols-1 gap-6 md:grid-cols-2 md:gap-5">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={
                tier.popular
                  ? "relative flex flex-col border-2 border-primary-container bg-[#161616] p-8 sm:p-10"
                  : "relative flex flex-col border border-white/10 bg-[#141414] p-8 sm:p-10"
              }
            >
              {tier.popular && (
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-primary-container px-4 py-1 font-[Inter] text-[11px] font-semibold uppercase tracking-[0.18em] text-on-primary-fixed">
                  Most popular
                </span>
              )}

              <p className="mb-2 font-[Inter] text-[12px] font-semibold uppercase tracking-[0.18em] text-[#737373]">
                {tier.name}
              </p>
              <p className="mb-6 font-serif text-lg leading-[1.35] text-surface-container/90">
                {tier.tagline}
              </p>

              <div className="mb-6 flex items-baseline gap-3">
                <span className="font-serif text-[clamp(40px,5.5vw,56px)] leading-none tracking-[-0.02em] text-surface-container">
                  {tier.price}
                </span>
                <span className="font-[Inter] text-xs text-[#a3a3a3]">
                  {tier.priceNote}
                </span>
              </div>

              <p className="mb-6 font-[Inter] text-sm leading-[1.55] text-[#a3a3a3]">
                {tier.forWho}
              </p>

              <ul className="mb-8 space-y-3">
                {tier.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 font-[Inter] text-[14px] leading-[1.55] text-surface-container/90"
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
                href={`/?tier=${tier.id}#phone`}
                className={
                  tier.popular
                    ? "mb-4 inline-block bg-primary-container px-6 py-3.5 text-center font-[Inter] text-[12px] font-semibold uppercase tracking-[0.05em] text-on-primary-fixed transition-opacity hover:opacity-80"
                    : "mb-4 inline-block border border-primary-container px-6 py-3.5 text-center font-[Inter] text-[12px] font-semibold uppercase tracking-[0.05em] text-primary-container transition-colors hover:bg-primary-container/10"
                }
              >
                {tier.cta}
              </a>

              <p className="mt-auto border-t border-white/5 pt-4 font-[Inter] text-[12px] leading-[1.5] text-[#737373]">
                <span className="font-semibold uppercase tracking-[0.14em] text-[#a3a3a3]">
                  Guarantee
                </span>
                <br />
                {tier.guarantee}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center font-[Inter] text-sm leading-[1.6] text-[#737373]">
          We onboard a small cohort each month — limited Install and Audit
          slots per intake.
        </p>
      </div>
    </section>
  );
};

