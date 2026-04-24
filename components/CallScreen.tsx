"use client";

import { useEffect, useRef } from "react";
import {
  Mic,
  PhoneOff,
  Signal,
  Wifi,
  BatteryMedium,
  Loader2,
} from "lucide-react";
import { WaveformPlayer } from "./WaveformPlayer";
import type { CallPhase, Utterance } from "./use-live-session";

export type CallScreenProps = {
  phase: CallPhase;
  utterances: Utterance[];
  elapsed: number;
  level: number;
  onEnd: () => void;
};

const DEMO_UTTERANCES: Utterance[] = [
  { who: "agent", text: "Hola, ¿en qué puedo ayudarte hoy?" },
  {
    who: "user",
    text: "Tengo una pequeña empresa. Necesito ayuda para organizar mejor mis clientes y las reseñas en línea.",
  },
  {
    who: "agent",
    text: "Entendido. Con cinco minutos puedo identificar las herramientas que mejor se adaptan a tu negocio…",
  },
];

function mmss(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function phaseStatus(phase: CallPhase, elapsed: number): string {
  switch (phase) {
    case "idle":
      return "Tap call to start";
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
  onEnd,
}) => {
  const isLive =
    phase === "live" ||
    phase === "ending" ||
    phase === "report_generating" ||
    phase === "report_ready";

  const showGenerating = phase === "report_generating" || phase === "ending";

  const rendered = isLive ? utterances : DEMO_UTTERANCES;
  const status = phaseStatus(phase, elapsed);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rendered]);

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        background: "var(--bg-cream)",
        color: "var(--ink)",
      }}
    >
      <div
        className="flex items-center justify-between px-6 pb-2 pt-1 text-[13px] font-bold"
        style={{ color: "var(--ink)" }}
      >
        <span>9:41</span>
        <div className="flex items-center gap-1" aria-hidden>
          <Signal size={13} strokeWidth={2.5} />
          <Wifi size={13} strokeWidth={2.5} />
          <BatteryMedium size={18} strokeWidth={2.2} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 px-6 pt-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--olive)" }}
        >
          {showGenerating ? (
            <Loader2
              size={22}
              strokeWidth={2.25}
              className="animate-spin text-[var(--bg-cream)]"
            />
          ) : (
            <Mic size={22} strokeWidth={2.25} className="text-[var(--bg-cream)]" />
          )}
        </div>
        <p
          className="font-display text-[22px] font-bold leading-none"
          style={{ color: "var(--ink)" }}
        >
          Clario
        </p>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{
              background:
                phase === "live"
                  ? "#2BAE66"
                  : phase === "error"
                    ? "var(--terracotta)"
                    : "var(--olive)",
            }}
          />
          <span
            className="text-[12px] font-bold uppercase tracking-label"
            style={{ color: "var(--ink-soft)" }}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="mt-5 px-6">
        <WaveformPlayer />
      </div>

      <div
        ref={scrollRef}
        className="mt-3 flex-1 overflow-y-auto px-6 pb-2"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="space-y-3">
          {rendered.length === 0 && isLive && (
            <p
              className="text-center text-[12px]"
              style={{ color: "var(--ink-faint)" }}
            >
              Listening…
            </p>
          )}
          {rendered.map((line, i) => {
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
                      ? "var(--bg-card)"
                      : "var(--terracotta)",
                    color: isAgent ? "var(--ink)" : "var(--bg-cream)",
                    border: isAgent
                      ? "1px solid var(--olive-soft)"
                      : "1px solid var(--terracotta)",
                  }}
                >
                  <p
                    className="mb-0.5 text-[10px] font-bold uppercase tracking-label"
                    style={{
                      color: isAgent
                        ? "var(--olive)"
                        : "rgba(248, 242, 230, 0.85)",
                    }}
                  >
                    {isAgent ? "CLARIO" : "YOU"}
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
          disabled={!isLive || phase === "ending"}
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-[0_6px_14px_rgba(192,90,62,0.45)] transition-transform duration-150 hover:scale-105 disabled:opacity-50"
          style={{ background: "var(--terracotta)" }}
        >
          <PhoneOff
            size={22}
            strokeWidth={2.5}
            className="text-[var(--bg-cream)]"
          />
        </button>
      </div>
    </div>
  );
};
