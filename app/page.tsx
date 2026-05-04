import { HomeHero } from "@/components/HomeHero";
import { SiteFooter } from "@/components/site/SiteFooter";
import { RoiCalculator } from "@/components/site/RoiCalculator";
import { HowItWorks } from "@/components/site/HowItWorks";
import { SampleReport } from "@/components/site/SampleReport";
import { Testimonials } from "@/components/site/Testimonials";
import { PricingSection } from "@/components/site/PricingSection";
import { FinalCta } from "@/components/site/FinalCta";

export default function Page() {
  return (
    <>
      <main className="relative z-10">
        <HomeHero />
        <RoiCalculator />
        <HowItWorks />
        <SampleReport />
        <Testimonials />
        <PricingSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
