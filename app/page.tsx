import { HomeHero } from "@/components/HomeHero";
import { TopNav } from "@/components/site/TopNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { RoiCalculator } from "@/components/site/RoiCalculator";
import { HowItWorks } from "@/components/site/HowItWorks";
import { SampleReport } from "@/components/site/SampleReport";

export default function Page() {
  return (
    <>
      <TopNav />
      <main className="relative z-10 pt-[80px]">
        <HomeHero />
        <RoiCalculator />
        <HowItWorks />
        <SampleReport />
      </main>
      <SiteFooter />
    </>
  );
}
