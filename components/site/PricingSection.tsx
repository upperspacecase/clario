import { PROMISES } from "@/lib/promises";

type Tier = {
  id: "free" | "full";
  name: string;
  intent: string;
  price: string;
  priceSuffix: string;
  blurb: string;
  includes: string[];
  cta: string;
  ctaHref: string;
  popular?: boolean;
};

const tiers: Tier[] = [
  {
    id: "free",
    name: "Free Assessment",
    intent: "I want one useful answer first.",
    price: "Free",
    priceSuffix: "one workflow",
    blurb: `${PROMISES.freeCallSentence} ${PROMISES.freeSlaSentence}`,
    includes: [
      "About ten minutes by phone",
      "One-page visual assessment",
      "One priority recommendation, with assumptions and confidence shown",
      "An agent-ready implementation prompt",
    ],
    cta: "Get your free assessment",
    ctaHref: "#call",
  },
  {
    id: "full",
    name: "Full Assessment",
    intent: "I want the whole operation mapped.",
    price: "$497",
    priceSuffix: "one-time",
    blurb: `${PROMISES.fullDurationLabel}. ${PROMISES.fullSlaSentence}`,
    includes: [
      "All six workflows mapped, with ranges and confidence",
      "No more than three priority changes",
      "Visual report plus a machine-readable Markdown file",
      "Four-day action plan",
      "Upgrade from your free report — nothing asked twice",
      `An ${PROMISES.followUpLabel}`,
    ],
    cta: "Start free, upgrade in one click",
    ctaHref: "#call",
    popular: true,
  },
];

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="relative py-[80px] md:py-[120px]">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-16">
          <span className="mb-4 block text-[13px] font-semibold uppercase tracking-widest text-[#16a34a]">
            Investment
          </span>
          <h2 className="max-w-2xl text-[clamp(28px,4.5vw,44px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#0B3049]">
            Start free. Go deep for $497.
          </h2>
        </div>

        <div className="mx-auto mb-8 grid max-w-[900px] grid-cols-1 gap-6 md:grid-cols-2">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={
                tier.popular
                  ? "relative flex h-full flex-col overflow-hidden rounded-[28px] border-2 border-[#16a34a] bg-white p-9 shadow-[0_24px_60px_-30px_rgba(22,163,74,0.35)]"
                  : "relative flex h-full flex-col rounded-[28px] border border-[#0B3049]/8 bg-white p-9"
              }
            >
              {tier.popular && (
                <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#16a34a] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  The full picture
                </div>
              )}

              <p className="mb-2 text-[12px] italic text-[#6B8199]">
                {tier.intent}
              </p>
              <h3 className="mb-4 text-2xl font-bold tracking-[-0.01em] text-[#0B3049]">
                {tier.name}
              </h3>
              <div className="mb-7">
                <div className="text-4xl font-bold tracking-[-0.02em] text-[#0B3049]">
                  {tier.price}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-[#6B8199]">
                  {tier.priceSuffix}
                </div>
              </div>

              <p className="mb-7 text-[15px] leading-[1.6] text-[#476582]">
                {tier.blurb}
              </p>

              <ul className="mb-8 space-y-3.5">
                {tier.includes.map((label) => (
                  <li
                    key={label}
                    className="flex items-start gap-3 text-sm leading-[1.5] text-[#0B3049]/80"
                  >
                    <span
                      aria-hidden
                      className="material-symbols-outlined text-lg text-[#16a34a]"
                    >
                      check
                    </span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <a
                  href={tier.ctaHref}
                  className={
                    tier.popular
                      ? "block w-full rounded-full bg-[#16a34a] py-3.5 text-center text-[14px] font-semibold text-white transition-colors hover:bg-[#15803d]"
                      : "block w-full rounded-full border border-[#0B3049]/20 py-3.5 text-center text-[14px] font-semibold text-[#0B3049] transition-colors hover:bg-[#0B3049]/5"
                  }
                >
                  {tier.cta}
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mb-24 max-w-[900px] text-center text-[13px] leading-[1.6] text-[#6B8199]">
          Implementation is scoped separately after the strategy call — it is
          never sold inside the assessment.
        </p>

        <div className="mx-auto max-w-4xl rounded-[28px] border border-[#0B3049]/8 bg-white p-12 text-center">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#DDF2E4]">
            <span
              aria-hidden
              className="material-symbols-outlined text-[#16a34a]"
            >
              verified
            </span>
          </div>
          <h3 className="mb-6 text-3xl font-bold tracking-[-0.01em] text-[#0B3049]">
            {PROMISES.guaranteeLabel}
          </h3>
          <p className="mx-auto max-w-2xl text-base leading-[1.6] text-[#476582] md:text-lg">
            {PROMISES.guaranteeSentence}
          </p>
        </div>
      </div>
    </section>
  );
};
