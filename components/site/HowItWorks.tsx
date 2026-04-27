const steps = [
  {
    n: "01",
    title: "Tell us where time gets lost",
    body: "Complete a focused asynchronous survey or a 30-minute AI-guided audio interview. We gather raw data on your operational friction points.",
  },
  {
    n: "02",
    title: "We assess the leaks",
    body: "Our system maps your qualitative inputs against established operational frameworks to identify systemic redundancies and tool sprawl.",
  },
  {
    n: "03",
    title: "Get your action plan",
    body: "Receive a tactile, high-contrast digital report detailing exact hours to reclaim, immediate next steps, and specific tool consolidations.",
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="border-t border-white/5 bg-[#0f0f0f] py-[120px]"
    >
      <div className="mx-auto max-w-[1120px] px-8">
        <div className="mb-20 text-center">
          <h2 className="font-serif text-[40px] leading-[1.2] text-surface-container">
            A quiet, precise intervention.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <div key={step.n} className="relative border-l border-white/10 pl-6">
              <div className="pointer-events-none absolute -left-6 -top-10 select-none font-serif text-[100px] leading-none text-primary-container opacity-20">
                {step.n}
              </div>
              <h3 className="relative z-10 mb-4 mt-8 font-serif text-2xl text-surface-container">
                {step.title}
              </h3>
              <p className="font-[Inter] text-base leading-[1.6] text-[#a3a3a3]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
