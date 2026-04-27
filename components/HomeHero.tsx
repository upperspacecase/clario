"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveSession } from "./use-live-session";
import { PhoneStage } from "./PhoneStage";
import { WebGLShader } from "./ui/web-gl-shader";
import { RotatingLanguages } from "./RotatingLanguages";

const FALLBACK_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:3043`
    : "ws://localhost:3043");

const PHASE_HINT: Record<string, string> = {
  idle: "Tap the green phone. Annie picks up and asks about your business.",
  requesting_mic: "Allow microphone access in the browser to continue.",
  connecting: "Opening the line…",
  live: "Speak naturally. End the call from the phone whenever you're done.",
  ending: "Wrapping up the interview.",
  report_generating: "Writing your report — about 15–30 seconds.",
  report_ready: "Opening your report…",
  error: "Something went wrong. Tap the green phone again to retry.",
};

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

  const hint = PHASE_HINT[live.phase] ?? PHASE_HINT.idle;
  const displayedError = live.error ?? startError;

  return (
    <>
      <WebGLShader />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1320px] items-center px-[clamp(16px,4vw,48px)] py-[clamp(24px,5vw,72px)]">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div className="relative w-full self-center border border-[#27272a] bg-black/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <div className="relative border border-[#27272a] bg-black px-[clamp(20px,3vw,40px)] py-[clamp(36px,6vw,72px)]">
              <div className="mb-6 flex items-center justify-center gap-1.5">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-green-500">
                  Prototype · Early access
                </p>
              </div>

              <h1
                className="mb-5 text-center font-extrabold tracking-tighter text-white"
                style={{
                  fontSize: "clamp(36px, 4.2vw, 60px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.03em",
                }}
              >
                Twelve minutes on the phone. The tools that give you back your time.
              </h1>

              <p
                className="mx-auto max-w-[440px] text-center italic text-white/60"
                style={{
                  fontSize: "clamp(14px, 1.4vw, 18px)",
                  lineHeight: 1.4,
                }}
              >
                A short call. A tailored report. Hours back every week.
              </p>

              <p className="mx-auto mt-8 max-w-[420px] text-center text-[14px] leading-[1.6] text-white/55">
                Hours is a voice-driven AI opportunity assessment for business
                owners. Annie spends 20–40 minutes with you, then our team
                builds a written report of the tools and next steps that fit
                your work.
              </p>

              <p className="mx-auto mt-5 max-w-[420px] text-center text-[14px] leading-[1.6] text-white/75">
                Supports 70+ languages, including{" "}
                <RotatingLanguages />
                .
              </p>

              <p className="mt-10 text-center text-[12px] uppercase tracking-[0.18em] text-white/40">
                {starting ? "Connecting…" : hint}
              </p>

              {displayedError && (
                <p className="mt-3 text-center text-[12px] text-red-400">
                  {displayedError}
                </p>
              )}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
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
    </>
  );
};
