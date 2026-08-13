"use client";

import { CallRequestPanel } from "./CallRequestPanel";
import { PROMISES } from "@/lib/promises";

export const HomeHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-[96px] text-surface-container md:py-[160px]">
      <div className="relative z-10 mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-5 md:grid-cols-12 md:gap-8 md:px-8">
        <div className="pr-0 md:col-span-7 md:pr-12">
          <h1 className="mb-5 font-serif text-[clamp(34px,6vw,64px)] leading-[1.1] tracking-[-0.02em] text-white md:mb-6">
            Get hours back for what matters most.
          </h1>

          <p className="mb-7 max-w-xl font-[Inter] text-base leading-[1.6] text-[#a3a3a3] md:mb-8 md:text-lg">
            Your team is losing 8–12 hours a week to manual admin, missed
            follow-up, duplicate work, and disconnected tools. We help you find
            exactly where, what to fix first, and the dollar value of getting
            it back.
          </p>

          <p className="flex items-start gap-2 font-[Inter] text-sm leading-[1.6] text-[#737373]">
            <span className="material-symbols-outlined mt-0.5 text-[16px]">
              schedule
            </span>
            {PROMISES.callDurationLabel}. One clear report,{" "}
            {PROMISES.reportSlaLabel}. Practical next steps to save time, reduce
            friction, and create more room for growth.
          </p>
        </div>

        <div className="relative flex justify-center md:col-span-5">
          <CallRequestPanel />
        </div>
      </div>
    </section>
  );
};
