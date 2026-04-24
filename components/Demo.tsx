"use client";

import {
  Mic,
  Play,
  Calendar,
  MessageSquare,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { WaveformPlayer } from "./WaveformPlayer";

type Line = { who: "CLARIO" | "USUARIO"; text: string; delay: number };

const lines: Line[] = [
  {
    who: "CLARIO",
    text: "Hola, ¿en qué puedo ayudarte hoy?",
    delay: 0.1,
  },
  {
    who: "USUARIO",
    text: "Tengo un restaurante familiar en Sevilla. Necesito ayuda para gestionar mejor mis reservas y las reseñas en línea. ¡Son demasiadas cosas!",
    delay: 0.25,
  },
  {
    who: "CLARIO",
    text: "Entendido. Con solo cinco minutos, puedo identificar las herramientas de IA que se adaptan a tus necesidades específicas. Hablemos sobre tu volumen actual…",
    delay: 0.4,
  },
];

type Card = {
  label: string;
  body: string;
  tools: string;
  Icon: LucideIcon;
  delay: number;
};

const cards: Card[] = [
  {
    label: "RESERVATIONS",
    body: "Automate table bookings and manage waitlists efficiently.",
    tools: "AI Tools: OpenTable, Resy, SevenRooms.",
    Icon: Calendar,
    delay: 0.55,
  },
  {
    label: "REVIEWS",
    body: "Monitor and respond to customer feedback across platforms.",
    tools: "AI Tools: ReviewTrackers, Birdeye, Reputation.",
    Icon: MessageSquare,
    delay: 0.7,
  },
  {
    label: "SOCIAL",
    body: "Create and schedule engaging content for your audience.",
    tools: "AI Tools: Canva, Buffer, Later.",
    Icon: Share2,
    delay: 0.85,
  },
];

export const Demo: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Waveform + transcript card */}
      <div className="relative">
        <div className="w-full px-4 sm:px-8">
          <WaveformPlayer />
        </div>
        <div
          className="relative mt-6 rounded-[18px] bg-[var(--bg-card)] p-6 sm:p-7"
          style={{ border: "1px solid var(--olive-soft)" }}
        >
          {/* Mic badge */}
          <div
            className="absolute -top-5 left-6 h-10 w-10 rounded-full flex items-center justify-center"
            style={{ background: "var(--olive)" }}
          >
            <Mic size={18} strokeWidth={2.25} className="text-[var(--bg-cream)]" />
          </div>

          <div className="space-y-4 pt-2">
            {lines.map((line, i) => (
              <p
                key={i}
                className="clario-line text-[15px] leading-[1.55]"
                style={{
                  animationDelay: `${line.delay}s`,
                  color: "var(--ink)",
                }}
              >
                <span className="font-bold">{line.who}:</span>{" "}
                <span style={{ color: "var(--ink-soft)" }}>{line.text}</span>
              </p>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-6 flex items-center gap-3">
            <div
              className="h-[2px] flex-1 rounded-full"
              style={{ background: "var(--olive-soft)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: "12%",
                  background: "var(--olive)",
                }}
              />
            </div>
            <span
              className="text-[12px]"
              style={{ color: "var(--ink-faint)" }}
            >
              0:05 / 5:00
            </span>
            <Play size={14} style={{ color: "var(--ink-faint)" }} />
          </div>
        </div>
      </div>

      {/* Recommendation cards */}
      <div className="flex flex-col gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="clario-card rounded-xl bg-[var(--bg-card)] p-5 sm:p-6"
            style={{
              animationDelay: `${card.delay}s`,
              border: "1px solid var(--olive-soft)",
            }}
          >
            <div className="flex gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--olive)" }}
              >
                <card.Icon size={18} strokeWidth={2.25} />
              </div>
              <div className="flex-1">
                <p
                  className="text-[12px] font-bold uppercase tracking-label"
                  style={{ color: "var(--ink)" }}
                >
                  {card.label}
                </p>
                <p
                  className="mt-2 text-[14px] leading-[1.55]"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {card.body}
                </p>
                <p
                  className="mt-3 text-[14px] leading-[1.55]"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {card.tools}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
