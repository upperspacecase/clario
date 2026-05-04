"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveSession } from "./use-live-session";
import { PhoneStage } from "./PhoneStage";
import { CallScreen } from "./CallScreen";

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
        router.push(`/start/confirm/${assessmentId}`);
        return;
      }
      if (live.phase === "report_ready") {
        router.push(`/start/confirm/${assessmentId}`);
        return;
      }
    }

    if (!assessmentId && live.phase === "report_ready" && live.sessionId) {
      router.push(`/report/${live.sessionId}`);
    }
  }, [assessmentId, live.phase, live.sessionId, router]);

  const displayedError = live.error ?? startError;

  return (
    <section className="relative overflow-hidden bg-[#121212] bg-grain py-[72px] text-surface-container md:py-[160px]">
      <div className="relative z-10 mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-5 md:grid-cols-12 md:gap-8 md:px-8">
        <div className="pr-0 md:col-span-7 md:pr-12">
          <h1 className="mb-5 font-serif text-[clamp(34px,6vw,64px)] leading-[1.1] tracking-[-0.02em] text-surface-container md:mb-6">
            Get hours back for what matters most.
          </h1>

          <p className="mb-7 max-w-xl font-[Inter] text-base leading-[1.6] text-[#a3a3a3] md:mb-8 md:text-lg">
            Manual admin, missed follow-up, duplicate work, and disconnected
            tools quietly drain hours from you and your team every day. We help
            you find where time is being lost, which workflows are worth
            improving, what tools fit best, and what to do next.
          </p>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
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

          <p className="flex items-start gap-2 font-[Inter] text-sm leading-[1.6] text-[#737373]">
            <span className="material-symbols-outlined mt-0.5 text-[16px]">
              schedule
            </span>
            One short AI assisted call. One clear report. Practical next steps
            to save time, reduce friction, and create more room for growth.
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
          className="relative flex scroll-mt-24 justify-center md:col-span-5"
        >
          <PhoneStage>
            <CallScreen
              phase={live.phase}
              utterances={live.utterances}
              elapsed={live.elapsed}
              level={live.level}
              onStart={handleStart}
              onEnd={live.end}
            />
          </PhoneStage>
        </div>
      </div>
    </section>
  );
};
