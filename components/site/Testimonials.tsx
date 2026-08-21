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
    <section className="py-[80px] md:py-[120px]">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-14 text-center md:mb-16">
          <h2 className="text-[clamp(28px,4.5vw,44px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#0B3049]">
            What getting hours back feels like
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <figure
              key={i}
              className="flex h-full flex-col rounded-[28px] border border-[#0B3049]/6 bg-white p-8"
            >
              <div className="mb-6 h-14 w-14 overflow-hidden rounded-full">
                <Image
                  src={q.image}
                  alt=""
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                />
              </div>
              <blockquote className="mb-6 text-lg leading-relaxed text-[#0B3049]">
                &ldquo;{q.body}&rdquo;
              </blockquote>
              <figcaption className="mt-auto text-[11px] font-semibold uppercase tracking-widest text-[#6B8199]">
                {q.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
