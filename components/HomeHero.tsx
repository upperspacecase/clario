"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight } from "lucide-react";
import { useLiveSession } from "./use-live-session";
import { PhoneStage } from "./PhoneStage";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:3043`
    : "ws://localhost:3043");

const PHASE_COPY: Record<string, { label: string; hint: string }> = {
  idle: {
    label: "Call now",
    hint: "Five minutes. Answer in your own language. Get a written report.",
  },
  requesting_mic: {
    label: "Connecting…",
    hint: "Allow microphone access to start.",
  },
  connecting: {
    label: "Connecting…",
    hint: "Opening the line.",
  },
  live: {
    label: "On call",
    hint: "Speak naturally. End the call from the phone whenever you're done.",
  },
  ending: {
    label: "Ending…",
    hint: "Wrapping up the interview.",
  },
  report_generating: {
    label: "Generating your report…",
    hint: "This takes about 15–30 seconds.",
  },
  report_ready: {
    label: "Report ready",
    hint: "Opening your report.",
  },
  error: {
    label: "Try again",
    hint: "Something went wrong. Tap to retry.",
  },
};

export const HomeHero: React.FC = () => {
  const router = useRouter();
  const live = useLiveSession({ wsUrl: WS_URL });
  const copy = PHASE_COPY[live.phase] ?? PHASE_COPY.idle;

  useEffect(() => {
    if (live.phase === "report_ready" && live.sessionId) {
      router.push(`/report/${live.sessionId}`);
    }
  }, [live.phase, live.sessionId, router]);

  const ctaDisabled =
    live.phase === "requesting_mic" ||
    live.phase === "connecting" ||
    live.phase === "ending" ||
    live.phase === "report_generating";

  const showCta = live.phase === "idle" || live.phase === "error";

  return (
    <section className="mx-auto w-full max-w-content px-[clamp(20px,5vw,64px)] pt-[clamp(48px,8vw,96px)]">
      <div className="grid gap-12 lg:grid-cols-[48fr_52fr] lg:gap-16">
        <div className="lg:pt-4">
          <p
            className="text-[12px] font-bold uppercase tracking-label"
            style={{ color: "var(--olive)" }}
          >
            Pre-launch · Early-access prototype
          </p>
          <h1
            className="mt-6 font-display font-black"
            style={{
              fontSize: "clamp(44px, 5.6vw, 84px)",
              lineHeight: 0.98,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
            }}
          >
            Five minutes
            <br />
            on the phone.
            <br />
            Tools that fit
            <br />
            your business.
          </h1>
          <p
            className="mt-8 font-display italic"
            style={{
              fontSize: "clamp(20px, 2.2vw, 28px)",
              lineHeight: 1.25,
              color: "var(--ink-soft)",
            }}
          >
            Cinco minutos al teléfono. Herramientas
            <br className="hidden sm:block" />
            que se adaptan a tu negocio.
          </p>

          <div className="mt-8">
            {showCta ? (
              <button
                type="button"
                onClick={live.start}
                disabled={ctaDisabled}
                className="group inline-flex items-center gap-3 rounded-full px-7 py-[18px] text-[16px] font-bold text-[var(--bg-cream)] transition-all duration-150 disabled:opacity-60"
                style={{
                  background: "var(--terracotta)",
                  boxShadow: "0 10px 24px rgba(192, 90, 62, 0.35)",
                }}
                onMouseEnter={(e) => {
                  if (!ctaDisabled)
                    e.currentTarget.style.background =
                      "var(--terracotta-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--terracotta)";
                }}
              >
                <Phone size={18} strokeWidth={2.5} />
                {copy.label}
                <ArrowRight
                  size={16}
                  strokeWidth={2.5}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </button>
            ) : (
              <div
                className="inline-flex items-center gap-3 rounded-full px-7 py-[18px] text-[16px] font-bold"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--olive-soft)",
                  color: "var(--ink)",
                }}
              >
                <span
                  className="inline-block h-[8px] w-[8px] rounded-full"
                  style={{
                    background:
                      live.phase === "live" ? "#2BAE66" : "var(--olive)",
                    animation:
                      live.phase === "live"
                        ? "clario-rise 1.2s ease-in-out infinite alternate"
                        : undefined,
                  }}
                />
                {copy.label}
              </div>
            )}

            <p
              className="mt-3 text-[13px]"
              style={{ color: "var(--ink-faint)" }}
            >
              {copy.hint}
            </p>

            {live.error && (
              <p
                className="mt-3 text-[13px]"
                style={{ color: "var(--terracotta)" }}
              >
                {live.error}
              </p>
            )}
          </div>

          <p
            className="mt-10 max-w-md text-[15px]"
            style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}
          >
            Clario is a voice agent for owners of small and mid-sized
            businesses. Answer a short set of questions in your own language
            — English, Spanish, Portuguese, Italian, Vietnamese, whatever
            you run on — and receive a written report of practical tools and
            next steps you can act on this week.
          </p>
        </div>

        <div className="lg:pt-6">
          <PhoneStage
            phase={live.phase}
            utterances={live.utterances}
            elapsed={live.elapsed}
            level={live.level}
            onEnd={live.end}
          />
        </div>
      </div>
    </section>
  );
};
