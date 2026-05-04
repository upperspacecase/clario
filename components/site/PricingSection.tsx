type Tier = {
  id: "assessment" | "blueprint" | "advisory";
  name: string;
  price: string;
  priceSuffix?: string;
  blurb: string;
  includes: string[];
  cta: string;
  popular?: boolean;
};

const tiers: Tier[] = [
  {
    id: "assessment",
    name: "Hours Assessment",
    price: "€750",
    blurb: "Find your biggest operational leaks in a single focused session.",
    includes: [
      "60-minute diagnosis call",
      "Tool stack optimization",
      "Bottleneck identification",
      "Top 3 priority fix list",
      "Efficiency scoring",
    ],
    cta: "Book the Assessment",
  },
  {
    id: "blueprint",
    name: "Hours Blueprint",
    price: "€2,500",
    blurb: "Get the full plan to fix one core workflow from start to finish.",
    includes: [
      "Complete process mapping",
      "Standard Operating Procedures",
      "Automation logic diagrams",
      "Implementation timeline",
      "1x Follow-up review",
    ],
    cta: "Get the Blueprint",
    popular: true,
  },
  {
    id: "advisory",
    name: "Hours Advisory",
    price: "€3,500",
    priceSuffix: "/mo",
    blurb: "Ongoing guidance for multiple processes and continuous scaling.",
    includes: [
      "Weekly strategy calls",
      "Unlimited async support",
      "Monthly system assessments",
      "Team training sessions",
    ],
    cta: "Start Advisory",
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
            Start with diagnosis. Get the plan. Implement yourself.
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

              <h3 className="mb-4 font-serif text-2xl text-white">
                {tier.name}
              </h3>
              <div className="mb-8 font-serif text-4xl text-primary-container">
                {tier.price}
                {tier.priceSuffix && (
                  <span className="font-[Inter] text-lg text-[#a3a3a3]">
                    {tier.priceSuffix}
                  </span>
                )}
              </div>

              <p className="mb-8 font-[Inter] text-base leading-[1.6] text-[#a3a3a3]">
                {tier.blurb}
              </p>

              <ul className="mb-12 flex-grow space-y-4">
                {tier.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 font-[Inter] text-sm leading-[1.5] text-[#a3a3a3]"
                  >
                    <span
                      aria-hidden
                      className="material-symbols-outlined text-lg text-primary-container"
                    >
                      check
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href={`/start?tier=${tier.id}`}
                className={
                  tier.popular
                    ? "w-full bg-primary-container py-4 text-center font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-on-primary-fixed transition-opacity hover:opacity-90"
                    : "w-full border border-white/20 py-4 text-center font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/5"
                }
              >
                {tier.cta}
              </a>
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
            If your Assessment does not identify at least 3 actionable leaks worth
            €5K+/year, we extend the session at no extra cost until we do.
            Precision isn&apos;t optional; it&apos;s our mandate.
          </p>
        </div>
      </div>
    </section>
  );
};
