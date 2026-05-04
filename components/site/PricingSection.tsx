import { PROMISES } from "@/lib/promises";

type IncludeItem = { label: string; isNew?: boolean };

type Tier = {
  id: "pulse" | "diagnosis" | "sprint";
  name: string;
  intent: string;
  price: string;
  priceSuffix: string;
  blurb: string;
  includes: IncludeItem[];
  excludes?: string[];
  cta: string;
  ctaHref: string;
  popular?: boolean;
};

const tiers: Tier[] = [
  {
    id: "pulse",
    name: "Hours Pulse",
    intent: "I want to feel what this is before I commit.",
    price: "$97",
    priceSuffix: "one-time",
    blurb:
      "5-minute call → automated 1-page email summary, within 1 hour.",
    includes: [
      { label: "Leak score (1–10)" },
      { label: "One verified tool recommendation" },
      { label: "One quick-win idea" },
      { label: "Email summary within 1 hour" },
    ],
    excludes: [
      "Full written report",
      "Install playbook",
      "Follow-up call",
      "10× ROI guarantee",
    ],
    cta: "Try the Pulse — $97",
    ctaHref:
      "mailto:tay@life-time.co?subject=Hours%20Pulse%20waitlist&body=I%27d%20like%20to%20try%20the%20%2497%20Pulse%20when%20it%20opens.",
  },
  {
    id: "diagnosis",
    name: "Hours Diagnosis",
    intent: "I want a verified plan I can execute myself.",
    price: "$1,000",
    priceSuffix: "one-time",
    blurb: `${PROMISES.callDurationSentence} ${PROMISES.reportSlaSentence}`,
    includes: [
      { label: PROMISES.callDurationLabel },
      { label: `Full verified written report ${PROMISES.reportSlaLabel}` },
      { label: "4-day quick-win install playbook" },
      { label: PROMISES.followUpLabel },
    ],
    cta: "Book the Diagnosis",
    ctaHref: "/start",
    popular: true,
  },
  {
    id: "sprint",
    name: "Hours Sprint",
    intent: "I want it done, not just told.",
    price: "$4,997",
    priceSuffix: "one-time",
    blurb:
      "Everything in Diagnosis + the Team personally implements your top quick-win in 7 days, plus 4 weekly check-ins.",
    includes: [
      { label: "Everything in Diagnosis" },
      { label: "The Team implements top quick-win in 7 days" },
      { label: "30-day outcome guarantee" },
    ],
    cta: "Talk to the Team first",
    ctaHref:
      "mailto:tay@life-time.co?subject=Hours%20Sprint%20inquiry&body=I%27d%20like%20to%20discuss%20the%20%244%2C997%20Sprint.",
  },
];

export const PricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      className="relative border-t border-white/5 bg-[#1a1a1a] py-[80px] text-surface-container md:py-[120px]"
    >
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="mb-16">
          <span className="mb-4 block font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-primary-container">
            Investment
          </span>
          <h2 className="max-w-2xl font-serif text-[clamp(28px,5vw,40px)] leading-[1.2] text-white">
            Three ways in. Most start with the Diagnosis.
          </h2>
        </div>

        <div className="mb-24 grid grid-cols-1 gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={
                tier.popular
                  ? "relative flex h-full flex-col border-2 border-primary-container bg-white/[0.04] p-10"
                  : "relative flex h-full flex-col border border-white/10 bg-white/[0.02] p-10"
              }
            >
              {tier.popular && (
                <div className="absolute right-0 top-0 bg-primary-container px-3 py-1 font-[Inter] text-[10px] font-bold uppercase tracking-widest text-on-primary-fixed">
                  Most Popular
                </div>
              )}

              <p className="mb-2 font-[Inter] text-[12px] italic text-white/55">
                {tier.intent}
              </p>
              <h3 className="mb-4 font-serif text-2xl text-white">
                {tier.name}
              </h3>
              <div className="mb-8">
                <div className="font-serif text-4xl text-primary-container">
                  {tier.price}
                </div>
                <div className="mt-1 font-[Inter] text-xs uppercase tracking-widest text-[#737373]">
                  {tier.priceSuffix}
                </div>
              </div>

              <p className="mb-8 font-[Inter] text-base leading-[1.6] text-[#a3a3a3]">
                {tier.blurb}
              </p>

              <ul className="mb-6 space-y-4">
                {tier.includes.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-3 font-[Inter] text-sm leading-[1.5] text-[#a3a3a3]"
                  >
                    <span
                      aria-hidden
                      className="material-symbols-outlined text-lg text-primary-container"
                    >
                      check
                    </span>
                    <span>
                      {item.label}
                      {item.isNew && (
                        <span className="ml-2 inline-block bg-primary-container/20 px-1.5 py-0.5 font-[Inter] text-[10px] font-semibold uppercase tracking-widest text-primary-container">
                          new
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {tier.excludes && (
                <ul className="mb-6 space-y-3 border-t border-white/5 pt-4">
                  {tier.excludes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 font-[Inter] text-sm leading-[1.5] text-white/35"
                    >
                      <span
                        aria-hidden
                        className="material-symbols-outlined text-lg text-white/35"
                      >
                        close
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex flex-col gap-4">
                <a
                  href={tier.ctaHref}
                  className={
                    tier.popular
                      ? "w-full bg-primary-container py-4 text-center font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-on-primary-fixed transition-opacity hover:opacity-90"
                      : "w-full border border-white/20 py-4 text-center font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/5"
                  }
                >
                  {tier.cta}
                </a>

                {tier.id === "diagnosis" && (
                  <div className="text-center">
                    <div className="font-[Inter] text-sm font-semibold text-white">
                      {PROMISES.guaranteeLabel}
                    </div>
                    <div className="mt-1 font-[Inter] text-xs leading-[1.5] text-[#a3a3a3]">
                      {PROMISES.guaranteeSentence}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary-container/20">
            <span
              aria-hidden
              className="material-symbols-outlined text-primary-container"
            >
              verified
            </span>
          </div>
          <h3 className="mb-6 font-serif text-3xl italic text-white">
            The Hours Guarantee
          </h3>
          <p className="mx-auto max-w-2xl font-[Inter] text-base leading-[1.6] text-[#a3a3a3] md:text-lg">
            If your Assessment does not identify at least 3 actionable leaks
            worth $5K+/year, we extend the session at no extra cost until we
            do. Precision isn&apos;t optional; it&apos;s our mandate.
          </p>
        </div>
      </div>
    </section>
  );
};
