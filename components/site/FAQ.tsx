import { PROMISES } from "@/lib/promises";

const faqs = [
  {
    q: "What happens on the free call?",
    a: "You pick the workflow that hurts most, Sam rings you, and you talk for about ten minutes. Sam says up front that it's an AI call, asks about your current process, and your one-page assessment lands in your inbox within the hour.",
  },
  {
    q: "What's in the $497 Full Assessment?",
    a: `A 45-minute conversation across all six workflows — lead generation, client communication, showings, transactions, listings and admin. You get a visual report of no more than four pages, a machine-readable Markdown file, up to three priority changes, a four-day action plan, and an ${PROMISES.followUpLabel}. Delivered ${PROMISES.fullSlaLabel}.`,
  },
  {
    q: "Will you implement the changes for us?",
    a: "The assessment tells you what to change and how; implementation is scoped separately after the strategy call, either with us or a specialist we refer. Recommendations also ship with an agent-ready prompt so your own tools can do part of the setup.",
  },
  {
    q: "Am I talking to an AI?",
    a: "Yes — Sam is an AI interviewer and says so at the start of the call. You can stop, correct an answer, or ask for your data to be deleted at any point. Calls happen only when you request one; we never cold-call.",
  },
  {
    q: "We're not in the US — does this work for us?",
    a: "Yes. Hours accepts international phone numbers and currencies, and recommendations are checked against tools available in your market rather than assuming US practices apply everywhere.",
  },
  {
    q: "What's the guarantee?",
    a: PROMISES.guaranteeSentence,
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
