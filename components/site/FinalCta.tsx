export const FinalCta: React.FC = () => {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#0f0f0f] bg-grain py-[140px] text-surface-container">
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-8 text-center">
        <h2 className="mb-6 font-serif text-[clamp(40px,5vw,56px)] leading-[1.1] tracking-[-0.02em] text-surface-container">
          Get your hours back.
        </h2>
        <p className="mb-10 font-[Inter] text-lg leading-[1.6] text-[#a3a3a3]">
          If your business is losing time to repetitive work, the first step is
          to see it clearly. Hours gives you a practical audit and a clear path
          forward.
        </p>

        <a
          href="/#phone"
          className="mb-6 inline-block bg-primary-container px-10 py-4 font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-on-primary-fixed transition-opacity hover:opacity-80"
        >
          Get My Hours Audit
        </a>

        <p className="font-[Inter] text-sm leading-[1.6] text-[#737373]">
          Short call. Clear report. Better use of your most precious resource:
          time.
        </p>
      </div>
    </section>
  );
};
