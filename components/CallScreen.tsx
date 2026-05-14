"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Phone, PhoneOff } from "lucide-react";
import { WaveformPlayer } from "./WaveformPlayer";
import type { CallPhase, Utterance } from "./use-live-session";

export type CallScreenProps = {
  phase: CallPhase;
  utterances: Utterance[];
  elapsed: number;
  level: number;
  onStart: () => void;
  onEnd: () => void;
};

export const CallScreen: React.FC<CallScreenProps> = ({
  phase,
  utterances,
  onStart,
  onEnd,
}) => {
  const isLive =
    phase === "live" || phase === "ending" || phase === "ended";

  const isIdle = phase === "idle" || phase === "error";
  const isBusy =
    phase === "requesting_mic" ||
    phase === "connecting" ||
    phase === "ending";

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
  <div className="flex flex-1 flex-col items-center px-8 pb-10 pt-12">
    <Image
      src="/hrs-logo-light.png"
      alt="hrs"
      width={696}
      height={358}
      priority
      className="h-12 w-auto"
    />

    <div className="mt-14 text-center">
      <h2 className="text-[22px] font-bold leading-tight text-white">
        Start Assessment
      </h2>
      <p className="mx-auto mt-2 max-w-[230px] text-[14px] leading-snug text-white/65">
        Tap to start your 2 minute introductory call
      </p>
    </div>

    <div className="flex-1" />

    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onStart}
        aria-label="Begin your assessment"
        className="hours-call-btn relative flex h-[76px] w-[76px] items-center justify-center rounded-full transition-transform duration-150 hover:scale-[1.04] active:scale-[0.98]"
        style={{
          background: "#22c55e",
          boxShadow:
            "0 0 32px rgba(34, 197, 94, 0.55), 0 0 64px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        <Phone size={30} strokeWidth={2.25} fill="white" className="text-white" />
      </button>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
        Call now
      </p>
    </div>
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
                  {isAgent ? "SAM" : "YOU"}
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
