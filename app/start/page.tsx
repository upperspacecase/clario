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

const TEST_VOICES = ["Aoede", "Puck", "Charon", "Kore", "Fenrir"] as const;
type TestVoice = (typeof TEST_VOICES)[number];

export default function StartPage() {
  const router = useRouter();
  const live = useLiveSession({ wsUrl: FALLBACK_WS_URL });
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<TestVoice>("Kore");
  const previousPhaseRef = useRef(live.phase);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTestMode(new URLSearchParams(window.location.search).get("test") === "1");
  }, []);

  const handleStart = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/voice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testMode ? { voice: selectedVoice } : {}),
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
  }, [live, starting, testMode, selectedVoice]);

  useEffect(() => {
    const prev = previousPhaseRef.current;
    previousPhaseRef.current = live.phase;

    if (assessmentId) {
      const callEnded =
        prev === "live" || prev === "ending" || prev === "report_generating";
      if (
        callEnded &&
        (live.phase === "idle" || live.phase === "report_ready")
      ) {
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
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-10 md:px-8">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
        {testMode && (
          <div className="w-full border border-white/15 bg-black/40 p-3 text-center">
            <p className="mb-2 font-[Inter] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">
              Voice test · pick one, then call
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {TEST_VOICES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSelectedVoice(v)}
                  disabled={live.phase !== "idle" || starting}
                  className={
                    v === selectedVoice
                      ? "bg-primary-container px-3 py-1.5 font-[Inter] text-[11px] font-semibold uppercase tracking-[0.06em] text-on-primary-fixed disabled:opacity-50"
                      : "border border-white/20 px-3 py-1.5 font-[Inter] text-[11px] font-semibold uppercase tracking-[0.06em] text-white/70 transition-colors hover:bg-white/5 disabled:opacity-50"
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="mt-2 font-[Inter] text-[10px] text-white/40">
              Selected: <span className="text-white/70">{selectedVoice}</span>
            </p>
          </div>
        )}
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
