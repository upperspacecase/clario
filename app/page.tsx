import { HomeHero } from "@/components/HomeHero";
import { TopNav } from "@/components/site/TopNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { RoiCalculator } from "@/components/site/RoiCalculator";
import { Testimonials } from "@/components/site/Testimonials";
import { PricingSection } from "@/components/site/PricingSection";
import { FAQ } from "@/components/site/FAQ";

export default function Page() {
  return (
    <>
      <TopNav />
      <main className="relative z-10 pt-[80px]">
        <HomeHero />
        <RoiCalculator />
        <PricingSection />
        <Testimonials />
        <FAQ />
      </main>
      <SiteFooter />
    </>
  );
}
