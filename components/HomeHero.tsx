"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneStage } from "./PhoneStage";
import { CallScreen } from "./CallScreen";
import { PROMISES } from "@/lib/promises";

export const HomeHero: React.FC = () => {
  const router = useRouter();

  const goToStart = () => {
    router.push("/start");
  };

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

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/start"
              className="bg-primary-container px-8 py-4 text-center font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-on-primary-fixed transition-opacity hover:opacity-90"
            >
              Get My Hours Assessment
            </Link>
          </div>

          <p className="flex items-start gap-2 font-[Inter] text-sm leading-[1.6] text-[#737373]">
            <span className="material-symbols-outlined mt-0.5 text-[16px]">
              schedule
            </span>
            One {PROMISES.callDurationLabel}. One clear report,{" "}
            {PROMISES.reportSlaLabel}. Practical next steps to save time, reduce
            friction, and create more room for growth.
          </p>
        </div>

        <div className="relative flex justify-center md:col-span-5">
          <PhoneStage>
            <CallScreen
              phase="idle"
              utterances={[]}
              elapsed={0}
              level={0}
              onStart={goToStart}
              onEnd={() => {}}
            />
          </PhoneStage>
        </div>
      </div>
    </section>
  );
};
