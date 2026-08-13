"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Phone, PhoneOff } from "lucide-react";
import { WaveformPlayer } from "./WaveformPlayer";
import type { CallPhase, Utterance } from "./use-live-session";

export type CallStartFields = {
  firstName: string;
  businessName: string;
};

export type CallScreenProps = {
  phase: CallPhase;
  utterances: Utterance[];
  elapsed: number;
  level: number;
  initialFirstName?: string;
  initialBusinessName?: string;
  onStart: (fields: CallStartFields) => void;
  onEnd: () => void;
};

export const CallScreen: React.FC<CallScreenProps> = ({
  phase,
  utterances,
  initialFirstName,
  initialBusinessName,
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
        <IdleState
          initialFirstName={initialFirstName ?? ""}
          initialBusinessName={initialBusinessName ?? ""}
          onStart={onStart}
        />
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

const IdleState: React.FC<{
  initialFirstName: string;
  initialBusinessName: string;
  onStart: (fields: CallStartFields) => void;
}> = ({ initialFirstName, initialBusinessName, onStart }) => {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const canStart = firstName.trim().length > 0 && businessName.trim().length > 0;

  const submit = () => {
    if (!canStart) return;
    onStart({
      firstName: firstName.trim(),
      businessName: businessName.trim(),
    });
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 pb-8 pt-10">
      <Image
        src="/hrs-logo-light.png"
        alt="hrs"
        width={696}
        height={358}
        priority
        className="h-10 w-auto"
      />

      <div className="mt-6 text-center">
        <h2 className="text-[20px] font-bold leading-tight text-white">
          Start Assessment
        </h2>
        <p className="mx-auto mt-1.5 max-w-[260px] text-[12px] leading-snug text-white/60">
          Two quick details so Sam can address you by name.
        </p>
      </div>

      <div className="mt-5 flex w-full flex-col gap-3">
        <PhoneInput
          label="First name"
          autoComplete="given-name"
          value={firstName}
          onChange={setFirstName}
          onEnter={submit}
        />
        <PhoneInput
          label="Business name"
          autoComplete="organization"
          value={businessName}
          onChange={setBusinessName}
          onEnter={submit}
        />
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={submit}
          disabled={!canStart}
          aria-label="Begin your assessment"
          className="hours-call-btn relative flex h-[68px] w-[68px] items-center justify-center rounded-full transition-transform duration-150 hover:scale-[1.04] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          style={{
            background: "#22c55e",
            boxShadow: canStart
              ? "0 0 32px rgba(34, 197, 94, 0.55), 0 0 64px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
              : "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <Phone size={26} strokeWidth={2.25} fill="white" className="text-white" />
        </button>
        <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
          Call now
        </p>
      </div>
    </div>
  );
};

export const PhoneInput: React.FC<{
  label: string;
  value: string;
  autoComplete: string;
  type?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}> = ({ label, value, autoComplete, type = "text", placeholder, onChange, onEnter }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
      {label}
    </span>
    <input
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
      className="h-9 w-full rounded-md border border-white/10 bg-black/60 px-2.5 text-[14px] text-white placeholder:text-white/25 focus:border-[#22c55e]/60 focus:outline-none"
    />
  </label>
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
