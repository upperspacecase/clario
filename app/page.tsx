import { Demo } from "@/components/Demo";
import { HeroForm } from "@/components/HeroForm";
import { LogoStrip } from "@/components/LogoStrip";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <main className="relative z-10">
      {/* HERO + DEMO */}
      <section className="mx-auto w-full max-w-content px-[clamp(20px,5vw,64px)] pt-[clamp(48px,8vw,96px)]">
        <div className="grid gap-12 lg:grid-cols-[43fr_57fr] lg:gap-16">
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
              Three AI tools
              <br />
              that fit your
              <br />
              restaurant.
            </h1>
            <p
              className="mt-8 font-display italic"
              style={{
                fontSize: "clamp(20px, 2.2vw, 28px)",
                lineHeight: 1.25,
                color: "var(--ink-soft)",
              }}
            >
              Cinco minutos al teléfono. Tres herramientas de IA
              <br className="hidden sm:block" />
              que se adaptan a tu restaurante.
            </p>

            <HeroForm />

            <p
              className="mt-10 max-w-md text-[15px]"
              style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}
            >
              Clario calls you back, listens to how your restaurant actually
              runs — reservations, reviews, waste, staff — and sends a
              plain-language report of AI tools you can try this week. In
              Spanish, Portuguese, Italian, Vietnamese, or the language your
              kitchen already speaks.
            </p>
          </div>

          <div className="lg:pt-10">
            <Demo />
          </div>
        </div>
      </section>

      <LogoStrip />
      <Footer />
    </main>
  );
}
