"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveSession } from "@/components/use-live-session";
import { PhoneStage } from "@/components/PhoneStage";
import { CallScreen } from "@/components/CallScreen";

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

export default function StartPage() {
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

    if (!assessmentId) {
      if (live.phase === "report_ready" && live.sessionId) {
        router.push(`/report/${live.sessionId}`);
      }
      return;
    }

    const wasActive =
      prev === "live" ||
      prev === "ending" ||
      prev === "report_generating";
    const isOver =
      live.phase === "idle" ||
      live.phase === "ending" ||
      live.phase === "report_ready" ||
      live.phase === "error";

    if (wasActive && isOver) {
      router.push(`/start/confirm/${assessmentId}`);
    }
  }, [assessmentId, live.phase, live.sessionId, router]);

  const displayedError = live.error ?? startError;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-10 md:px-8">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
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
        {starting && (
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/50">
            Connecting…
          </p>
        )}
        {displayedError && (
          <p className="text-[12px] text-red-400">{displayedError}</p>
        )}
      </div>
    </main>
  );
}
