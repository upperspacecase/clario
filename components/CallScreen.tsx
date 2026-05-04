"use client";

import { useEffect, useRef } from "react";
import {
  Mic,
  Phone,
  PhoneOff,
  Signal,
  Wifi,
  BatteryMedium,
  Loader2,
} from "lucide-react";
import { WaveformPlayer } from "./WaveformPlayer";
import type { CallPhase, Utterance } from "./use-live-session";
import { PROMISES } from "@/lib/promises";

export type CallScreenProps = {
  phase: CallPhase;
  utterances: Utterance[];
  elapsed: number;
  level: number;
  onStart: () => void;
  onEnd: () => void;
};

function mmss(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function phaseStatus(phase: CallPhase, elapsed: number): string {
  switch (phase) {
    case "idle":
      return "Ready to call";
    case "requesting_mic":
      return "Mic permission…";
    case "connecting":
      return "Connecting…";
    case "live":
      return `On call · ${mmss(elapsed)}`;
    case "ending":
      return "Ending…";
    case "report_generating":
      return "Writing report…";
    case "report_ready":
      return "Report ready";
    case "error":
      return "Error";
  }
}

export const CallScreen: React.FC<CallScreenProps> = ({
  phase,
  utterances,
  elapsed,
  onStart,
  onEnd,
}) => {
  const isLive =
    phase === "live" ||
    phase === "ending" ||
    phase === "report_generating" ||
    phase === "report_ready";

  const isIdle = phase === "idle" || phase === "error";
  const isBusy =
    phase === "requesting_mic" ||
    phase === "connecting" ||
    phase === "ending" ||
    phase === "report_generating";

  const showGenerating = phase === "report_generating" || phase === "ending";

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [utterances]);

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: "#0a0a0a", color: "#fff" }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 pb-2 pt-1 text-[13px] font-bold text-white">
        <span>9:41</span>
        <div className="flex items-center gap-1" aria-hidden>
          <Signal size={13} strokeWidth={2.5} />
          <Wifi size={13} strokeWidth={2.5} />
          <BatteryMedium size={18} strokeWidth={2.2} />
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center gap-2 px-6 pt-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {showGenerating ? (
            <Loader2
              size={22}
              strokeWidth={2.25}
              className="animate-spin text-white"
            />
          ) : (
            <Mic size={22} strokeWidth={2.25} className="text-white" />
          )}
        </div>
        <p className="text-[22px] font-extrabold tracking-tight text-white">
          Annie
        </p>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{
              background:
                phase === "live"
                  ? "#22c55e"
                  : phase === "error"
                    ? "#ef4444"
                    : "rgba(255,255,255,0.5)",
            }}
          />
          <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/60">
            {phaseStatus(phase, elapsed)}
          </span>
        </div>
      </div>

      {isIdle ? (
        <IdleState onStart={onStart} />
      ) : (
        <LiveState
          utterances={utterances}
          scrollRef={scrollRef}
          isLive={isLive}
          isBusy={isBusy}
          phase={phase}
          onEnd={onEnd}
        />
      )}
    </div>
  );
};

const IdleState: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 pb-10">
    <p className="max-w-[280px] text-center text-[15px] leading-snug text-white/55">
      Tap to start your {PROMISES.callDurationLabel} with Annie. Speak any
      language.
    </p>

    <button
      type="button"
      onClick={onStart}
      aria-label="Call Annie"
      className="hours-call-btn relative flex h-[76px] w-[76px] items-center justify-center rounded-full transition-transform duration-150 hover:scale-[1.04] active:scale-[0.98]"
      style={{
        background: "#22c55e",
        boxShadow:
          "0 10px 24px rgba(34, 197, 94, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      <Phone size={30} strokeWidth={2.25} fill="white" className="text-white" />
    </button>

    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
      Call now
    </p>
  </div>
);

const LiveState: React.FC<{
  utterances: Utterance[];
  scrollRef: React.MutableRefObject<HTMLDivElement | null>;
  isLive: boolean;
  isBusy: boolean;
  phase: CallPhase;
  onEnd: () => void;
}> = ({ utterances, scrollRef, phase, onEnd }) => (
  <>
    <div className="mt-5 px-6">
      <WaveformPlayer />
    </div>

    <div
      ref={scrollRef}
      className="mt-3 flex-1 overflow-y-auto px-6 pb-2"
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="space-y-3">
        {utterances.length === 0 && (
          <p className="text-center text-[12px] text-white/40">Listening…</p>
        )}
        {utterances.map((line, i) => {
          const isAgent = line.who === "agent";
          return (
            <div
              key={i}
              className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
            >
              <div
                className="max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-[1.45]"
                style={{
                  background: isAgent
                    ? "rgba(255,255,255,0.06)"
                    : "#22c55e",
                  color: isAgent ? "#fff" : "#0a0a0a",
                  border: isAgent
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid #22c55e",
                }}
              >
                <p
                  className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{
                    color: isAgent ? "rgba(255,255,255,0.45)" : "rgba(10,10,10,0.7)",
                  }}
                >
                  {isAgent ? "ANNIE" : "YOU"}
                </p>
                {line.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="flex items-center justify-center pb-6 pt-3">
      <button
        type="button"
        aria-label="End call"
        onClick={onEnd}
        disabled={phase === "ending"}
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-[0_6px_14px_rgba(239,68,68,0.45)] transition-transform duration-150 hover:scale-105 disabled:opacity-50"
        style={{ background: "#ef4444" }}
      >
        <PhoneOff size={22} strokeWidth={2.5} className="text-white" />
      </button>
    </div>
  </>
);
