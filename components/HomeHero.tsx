import { HeroCallForm } from "./site/HeroCallForm";
import { PROMISES } from "@/lib/promises";

export const HomeHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pb-[64px] pt-[64px] md:pb-[96px] md:pt-[104px]">
      <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-5 md:grid-cols-12 md:gap-10 md:px-8">
        <div className="md:col-span-6 lg:col-span-7 lg:pr-8">
          <h1 className="mb-5 text-[clamp(36px,5.5vw,64px)] font-bold leading-[1.05] tracking-[-0.03em] text-[#0B3049] md:mb-6">
            Get hours back for what matters most.
          </h1>

          <p className="mb-7 max-w-xl text-base leading-[1.6] text-[#476582] md:mb-8 md:text-lg">
            Your team is losing 8–12 hours a week to manual admin, missed
            follow-up, duplicate work, and disconnected tools. One phone call
            with Sam finds exactly where, what to fix first, and the dollar
            value of getting it back.
          </p>

          <p className="flex items-start gap-2 text-sm leading-[1.6] text-[#6B8199]">
            <span aria-hidden className="material-symbols-outlined mt-0.5 text-[16px]">
              schedule
            </span>
            {PROMISES.callDurationLabel}. One clear report,{" "}
            {PROMISES.reportSlaLabel}. Practical next steps to save time, reduce
            friction, and create more room for growth.
          </p>
        </div>

        <div id="call" className="md:col-span-6 lg:col-span-5">
          <HeroCallForm />
        </div>
      </div>
    </section>
  );
};
