"use client";

import { Mic, PhoneOff, Signal, Wifi, BatteryMedium } from "lucide-react";
import { WaveformPlayer } from "./WaveformPlayer";

type Line = { who: "CLARIO" | "YOU"; text: string };

const lines: Line[] = [
  { who: "CLARIO", text: "Hola, ¿en qué puedo ayudarte hoy?" },
  {
    who: "YOU",
    text: "Tengo una pequeña empresa. Necesito ayuda para organizar mejor mis clientes y las reseñas en línea.",
  },
  {
    who: "CLARIO",
    text: "Entendido. Con cinco minutos puedo identificar las herramientas que mejor se adaptan a tu negocio…",
  },
];

export const CallScreen: React.FC = () => {
  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        background: "var(--bg-cream)",
        color: "var(--ink)",
      }}
    >
      {/* Status bar (tucked under dynamic island) */}
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

      {/* Call header */}
      <div className="flex flex-col items-center gap-2 px-6 pt-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--olive)" }}
        >
          <Mic size={22} strokeWidth={2.25} className="text-[var(--bg-cream)]" />
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
            style={{ background: "#2BAE66" }}
          />
          <span
            className="text-[12px] font-bold uppercase tracking-label"
            style={{ color: "var(--ink-soft)" }}
          >
            On call · 0:05
          </span>
        </div>
      </div>

      {/* Waveform */}
      <div className="mt-5 px-6">
        <WaveformPlayer />
      </div>

      {/* Live transcript */}
      <div className="mt-3 flex-1 overflow-hidden px-6">
        <div className="space-y-3">
          {lines.map((line, i) => {
            const isAgent = line.who === "CLARIO";
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
                    {line.who}
                  </p>
                  {line.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* End-call button */}
      <div className="flex items-center justify-center pb-6 pt-4">
        <button
          type="button"
          aria-label="End call"
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-[0_6px_14px_rgba(192,90,62,0.45)] transition-transform duration-150 hover:scale-105"
          style={{ background: "var(--terracotta)" }}
        >
          <PhoneOff size={22} strokeWidth={2.5} className="text-[var(--bg-cream)]" />
        </button>
      </div>
    </div>
  );
};
