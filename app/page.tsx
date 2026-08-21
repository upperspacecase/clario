import { HomeHero } from "@/components/HomeHero";
import { TopNav } from "@/components/site/TopNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProcessCards } from "@/components/site/ProcessCards";
import { RoiCalculator } from "@/components/site/RoiCalculator";
import { Testimonials } from "@/components/site/Testimonials";
import { PricingSection } from "@/components/site/PricingSection";
import { FAQ } from "@/components/site/FAQ";

export default function Page() {
  return (
    // The body background is dark for the rest of the app; the homepage runs
    // its own light Calendly-style surface, so it paints over it here.
    <div className="min-h-screen bg-[#F6F4EF] text-[#0B3049]">
      <TopNav />
      <main className="relative z-10 pt-[72px]">
        <HomeHero />
        <ProcessCards />
        <RoiCalculator />
        <PricingSection />
        <Testimonials />
        <FAQ />
      </main>
      <SiteFooter />
    </div>
  );
}
