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
    <section id="pricing" className="relative py-[80px] md:py-[120px]">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-16">
          <span className="mb-4 block text-[13px] font-semibold uppercase tracking-widest text-[#16a34a]">
            Investment
          </span>
          <h2 className="max-w-2xl text-[clamp(28px,4.5vw,44px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#0B3049]">
            Three ways in. Most start with the Diagnosis.
          </h2>
        </div>

        <div className="mb-24 grid grid-cols-1 gap-6 md:grid-cols-3">
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
                  Most Popular
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

              <ul className="mb-6 space-y-3.5">
                {tier.includes.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-3 text-sm leading-[1.5] text-[#0B3049]/80"
                  >
                    <span
                      aria-hidden
                      className="material-symbols-outlined text-lg text-[#16a34a]"
                    >
                      check
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>

              {tier.excludes && (
                <ul className="mb-6 space-y-3 border-t border-[#0B3049]/8 pt-4">
                  {tier.excludes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-[1.5] text-[#0B3049]/35"
                    >
                      <span
                        aria-hidden
                        className="material-symbols-outlined text-lg text-[#0B3049]/30"
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
                      ? "w-full rounded-full bg-[#16a34a] py-3.5 text-center text-[14px] font-semibold text-white transition-colors hover:bg-[#15803d]"
                      : "w-full rounded-full border border-[#0B3049]/20 py-3.5 text-center text-[14px] font-semibold text-[#0B3049] transition-colors hover:bg-[#0B3049]/5"
                  }
                >
                  {tier.cta}
                </a>

                {tier.id === "diagnosis" && (
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#0B3049]">
                      {PROMISES.guaranteeLabel}
                    </div>
                    <div className="mt-1 text-xs leading-[1.5] text-[#6B8199]">
                      {PROMISES.guaranteeSentence}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

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
            The Hours Guarantee
          </h3>
          <p className="mx-auto max-w-2xl text-base leading-[1.6] text-[#476582] md:text-lg">
            If your Assessment does not identify at least 3 actionable leaks
            worth $5K+/year, we extend the session at no extra cost until we
            do. Precision isn&apos;t optional; it&apos;s our mandate.
          </p>
        </div>
      </div>
    </section>
  );
};
