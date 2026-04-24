import { HeroForm } from "@/components/HeroForm";
import { PhoneStage } from "@/components/PhoneStage";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <main className="relative z-10">
      <section className="mx-auto w-full max-w-content px-[clamp(20px,5vw,64px)] pt-[clamp(48px,8vw,96px)]">
        <div className="grid gap-12 lg:grid-cols-[48fr_52fr] lg:gap-16">
          <div className="lg:pt-4">
            <p
              className="text-[12px] font-bold uppercase tracking-label"
              style={{ color: "var(--olive)" }}
            >
              Pre-launch · Early-access waitlist
            </p>
            <h1
              className="mt-6 font-display font-black"
              style={{
                fontSize: "clamp(44px, 5.6vw, 84px)",
                lineHeight: 0.98,
                letterSpacing: "-0.015em",
                color: "var(--ink)",
              }}
            >
              Five minutes
              <br />
              on the phone.
              <br />
              Tools that fit
              <br />
              your business.
            </h1>
            <p
              className="mt-8 font-display italic"
              style={{
                fontSize: "clamp(20px, 2.2vw, 28px)",
                lineHeight: 1.25,
                color: "var(--ink-soft)",
              }}
            >
              Cinco minutos al teléfono. Herramientas
              <br className="hidden sm:block" />
              que se adaptan a tu negocio.
            </p>

            <HeroForm />

            <p
              className="mt-10 max-w-md text-[15px]"
              style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}
            >
              Clario is a voice agent for owners of small and mid-sized
              businesses. Answer a short set of questions in your own
              language — English, Spanish, Portuguese, Italian, Vietnamese,
              whatever you run on — and receive a written report of
              practical tools and next steps you can act on this week.
            </p>
          </div>

          <div className="lg:pt-6">
            <PhoneStage />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
