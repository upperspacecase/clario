const quotes = [
  {
    body: "We finally saw where time was disappearing every week — and fixed it faster than expected.",
    role: "Operations lead, marketing studio",
  },
  {
    body: "The report was practical, clear, and focused on the work actually slowing us down.",
    role: "Founder, professional services",
  },
  {
    body: "Instead of testing random AI tools, we got a shortlist that made sense for our team.",
    role: "Director, design agency",
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="border-t border-white/5 bg-[#121212] py-[64px] text-surface-container md:py-[120px]">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="font-serif text-[clamp(28px,5vw,40px)] leading-[1.2] text-surface-container">
            What getting hours back feels like
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {quotes.map((q, i) => (
            <figure
              key={i}
              className="flex h-full flex-col justify-between border border-white/10 bg-white/5 p-8"
            >
              <span
                aria-hidden
                className="mb-4 font-serif text-5xl leading-none text-primary-container/40"
              >
                &ldquo;
              </span>
              <blockquote className="font-serif text-lg leading-[1.45] text-surface-container">
                {q.body}
              </blockquote>
              <figcaption className="mt-6 font-[Inter] text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                {q.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
