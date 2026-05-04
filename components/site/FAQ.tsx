const faqs = [
  {
    q: "What happens during the 60-minute assessment?",
    a: "We use a proprietary rapid-diagnosis framework to review your client journey, internal communication, and tool stack. No generic advice; strictly actionable identification of leaks.",
  },
  {
    q: "Will you implement the systems for us?",
    a: "We are advisory-only. We provide the blueprint, the logic, and the SOP templates. This keeps our costs low and ensures your team actually understands the systems they use.",
  },
  {
    q: "What tools do you specialize in?",
    a: "We are tool-agnostic but lean towards minimalist, high-ROI stacks like Notion, Zapier, Airtable, and Slack. We focus on the process logic first, the software second.",
  },
  {
    q: "How quickly will I see a return?",
    a: "The assessment identifies 'Quick Wins' — fixes that take under 30 minutes to implement but save 2+ hours a week immediately.",
  },
];

export const FAQ: React.FC = () => {
  return (
    <section className="border-t border-white/5 bg-[#1a1a1a] py-[80px] text-surface-container md:py-[120px]">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <h2 className="mb-16 text-center font-serif text-[clamp(28px,5vw,40px)] leading-[1.2] text-white md:mb-20">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group border border-white/10 bg-white/[0.02] p-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-[Inter] text-base font-semibold text-white md:text-lg">
                {item.q}
                <span className="material-symbols-outlined text-primary-container transition group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <p className="mt-4 font-[Inter] text-base leading-[1.6] text-[#a3a3a3]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};
