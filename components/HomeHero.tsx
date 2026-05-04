import Link from "next/link";
import { PROMISES } from "@/lib/promises";

export const HomeHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-[#1a1a1a] bg-grain py-[96px] text-surface-container md:py-[160px]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, #242424 0%, #1a1a1a 100%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-5 md:grid-cols-12 md:gap-8 md:px-8">
        <div className="pr-0 md:col-span-7 md:pr-12">
          <h1 className="mb-5 font-serif text-[clamp(34px,6vw,64px)] leading-[1.1] tracking-[-0.02em] text-white md:mb-6">
            Get hours back for what matters most.
          </h1>

          <p className="mb-7 max-w-xl font-[Inter] text-base leading-[1.6] text-[#a3a3a3] md:mb-8 md:text-lg">
            Manual admin, missed follow-up, duplicate work, and disconnected
            tools quietly drain hours from you and your team every day. We help
            you find where time is being lost, which workflows are worth
            improving, what tools fit best, and what to do next.
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
            One {PROMISES.callDurationLabel} with Iris. One clear report,{" "}
            {PROMISES.reportSlaLabel}. Practical next steps to save time, reduce
            friction, and create more room for growth.
          </p>
        </div>

        <div className="relative flex justify-center md:col-span-5">
          <div className="relative mx-auto h-[600px] w-[300px] overflow-hidden rounded-[3rem] border-[8px] border-[#2a2a2a] bg-[#121212] shadow-2xl">
            <div className="absolute left-1/2 top-0 z-20 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-[#2a2a2a]" />
            <div className="flex h-full w-full flex-col items-center justify-between bg-[#121212] px-6 py-20">
              <div className="mt-12 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-primary-container/30 bg-primary-container/20">
                  <span className="material-symbols-outlined text-5xl text-primary-container">
                    person
                  </span>
                </div>
                <h2 className="mb-2 font-serif text-2xl text-white">
                  Operational Assessment
                </h2>
                <p className="font-[Inter] text-sm uppercase tracking-widest text-[#a3a3a3]">
                  Incoming Audio Call
                </p>
              </div>
              <div className="mb-10 flex w-full items-center justify-around">
                <Link
                  href="/start"
                  aria-label="Answer the call"
                  className="mx-auto flex flex-col items-center gap-3"
                >
                  <span className="hours-call-btn flex h-20 w-20 items-center justify-center rounded-full bg-[#34c759] transition-transform hover:scale-105">
                    <span className="material-symbols-outlined text-4xl text-white">
                      call
                    </span>
                  </span>
                  <span className="font-[Inter] text-[10px] font-semibold uppercase tracking-widest text-[#a3a3a3]">
                    Answer
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
