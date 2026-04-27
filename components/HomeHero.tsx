"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveSession } from "./use-live-session";
import { PhoneStage } from "./PhoneStage";

const FALLBACK_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:3043`
    : "ws://localhost:3043");

type StartResponse = {
  assessmentId: string;
  shareId: string;
  voiceSessionToken: string;
  wsUrl: string;
};

export const HomeHero: React.FC = () => {
  const router = useRouter();
  const live = useLiveSession({ wsUrl: FALLBACK_WS_URL });
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const previousPhaseRef = useRef(live.phase);

  const handleStart = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/voice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `start failed (${res.status})`);
      }
      const data = (await res.json()) as StartResponse;
      setAssessmentId(data.assessmentId);
      console.log("[CLIENT] assessment started", data.assessmentId);
      await live.start({ wsUrl: data.wsUrl });
    } catch (e) {
      setStartError(e instanceof Error ? e.message : String(e));
    } finally {
      setStarting(false);
    }
  }, [live, starting]);

  useEffect(() => {
    const prev = previousPhaseRef.current;
    previousPhaseRef.current = live.phase;

    if (assessmentId) {
      const callEnded =
        prev === "live" || prev === "ending" || prev === "report_generating";
      if (callEnded && (live.phase === "idle" || live.phase === "report_ready")) {
        router.push(`/start/thanks?id=${assessmentId}`);
        return;
      }
      if (live.phase === "report_ready") {
        router.push(`/start/thanks?id=${assessmentId}`);
        return;
      }
    }

    if (!assessmentId && live.phase === "report_ready" && live.sessionId) {
      router.push(`/report/${live.sessionId}`);
    }
  }, [assessmentId, live.phase, live.sessionId, router]);

  const displayedError = live.error ?? startError;

  return (
    <section className="relative overflow-hidden bg-[#121212] bg-grain py-[160px] text-surface-container">
      <div className="relative z-10 mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-8 px-8 md:grid-cols-12">
        <div className="pr-0 md:col-span-7 md:pr-12">
          <span className="mb-8 inline-block rounded-full border border-primary-container px-4 py-1.5 font-[Inter] text-[13px] font-semibold uppercase tracking-widest text-primary-container">
            OPERATIONAL TIME AUDIT
          </span>

          <h1 className="mb-6 font-serif text-[clamp(40px,6vw,64px)] leading-[1.1] tracking-[-0.02em] text-surface-container">
            Free up time for what matters most.
          </h1>

          <p className="mb-8 max-w-lg font-[Inter] text-lg leading-[1.6] text-[#a3a3a3]">
            We help business owners and operators identify structural time leaks.
            Regain hours lost to friction and poorly designed systems.
          </p>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <a
              href="#phone"
              className="bg-primary-container px-8 py-4 text-center font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-on-primary-fixed transition-opacity hover:opacity-80"
            >
              Get My Hours Audit
            </a>
            <a
              href="#sample-report"
              className="border border-primary-container px-8 py-4 text-center font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-primary-container transition-colors hover:bg-primary-container/10"
            >
              See Sample Report
            </a>
          </div>

          <p className="flex items-center gap-2 font-[Inter] text-sm text-[#737373]">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            Includes a 30-minute AI discovery call and actionable report.
          </p>

          {starting && (
            <p className="mt-4 text-[12px] uppercase tracking-[0.18em] text-white/50">
              Connecting…
            </p>
          )}
          {displayedError && (
            <p className="mt-3 text-[12px] text-red-400">{displayedError}</p>
          )}
        </div>

        <div
          id="phone"
          className="relative mt-16 flex scroll-mt-24 justify-center md:col-span-5 md:mt-0"
        >
          <PhoneStage
            phase={live.phase}
            utterances={live.utterances}
            elapsed={live.elapsed}
            level={live.level}
            onStart={handleStart}
            onEnd={live.end}
          />
        </div>
      </div>
    </section>
  );
};
