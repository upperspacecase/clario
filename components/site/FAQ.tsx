import { PROMISES } from "@/lib/promises";

const faqs = [
  {
    q: "What happens during the call?",
    a: "A focused conversation covering your client journey, internal communication, and tool stack. You leave with a verified written report and a 4-day quick-win install playbook.",
  },
  {
    q: "Will you implement the systems for us?",
    a: "Diagnosis is advisory — we provide the blueprint, the logic, and the SOP templates so your team actually understands the systems they use. Sprint is done-with-you — the Team personally implements your top quick-win in 7 days.",
  },
  {
    q: "What tools do you specialize in?",
    a: "We are tool-agnostic but lean towards minimalist, high-ROI stacks like Notion, Zapier, Airtable, and Slack. We focus on the process logic first, the software second.",
  },
  {
    q: "How quickly will I see a return?",
    a: "The assessment identifies 'Quick Wins' — fixes that take under 30 minutes to implement but save 2+ hours a week immediately.",
  },
  {
    q: "What's the 10× ROI guarantee?",
    a: PROMISES.guaranteeSentence,
  },
  {
    q: "What's the difference between Pulse, Diagnosis, and Sprint?",
    a: "Pulse if you want a taste — 5 minutes on a call and a one-page summary in your inbox. Diagnosis if you want a verified plan you can execute yourself. Sprint if you want it done — the Team personally implements your top quick-win in 7 days.",
  },
];

export const FAQ: React.FC = () => {
  return (
    <section className="py-[80px] md:py-[120px]">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <h2 className="mb-14 text-center text-[clamp(28px,4.5vw,44px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#0B3049] md:mb-16">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-[#0B3049]/8 bg-white p-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-[#0B3049] md:text-lg">
                {item.q}
                <span className="material-symbols-outlined text-[#16a34a] transition group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <p className="mt-4 text-base leading-[1.6] text-[#476582]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};
