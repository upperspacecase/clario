import Image from "next/image";

const quotes = [
  {
    body: "We finally saw where time was disappearing every week — and fixed it faster than expected.",
    role: "Operations lead, marketing studio",
    image: "/testimonial images/30879d31-2580-453f-92dc-a03c7785c050.png",
  },
  {
    body: "The report was practical, clear, and focused on the work actually slowing us down.",
    role: "Founder, professional services",
    image: "/testimonial images/ae81c91f-e34b-46da-b128-45d0a715cb0c.png",
  },
  {
    body: "Instead of testing random AI tools, we got a shortlist that made sense for our team.",
    role: "Director, design agency",
    image: "/testimonial images/b935c7a0-cc91-40c1-9f97-4b7f51146d95.png",
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="border-t border-white/5 bg-[#1a1a1a] py-[80px] text-surface-container md:py-[120px]">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="mb-16 text-center md:mb-20">
          <h2 className="font-serif text-[clamp(28px,5vw,40px)] leading-[1.2] text-white">
            What getting hours back feels like
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {quotes.map((q, i) => (
            <figure
              key={i}
              className="flex h-full flex-col border border-white/10 bg-white/[0.02] p-8"
            >
              <div className="mx-auto mb-6 h-32 w-32 overflow-hidden rounded-full border border-primary-container/30">
                <Image
                  src={q.image}
                  alt=""
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              </div>
              <blockquote className="mb-6 font-serif text-xl italic leading-relaxed text-white">
                {q.body}
              </blockquote>
              <figcaption className="mt-auto font-[Inter] text-[11px] font-semibold uppercase tracking-widest text-primary-container">
                {q.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
