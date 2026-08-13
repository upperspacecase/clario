"use client";

import { useCallback, useState } from "react";
import { PhoneStage } from "./PhoneStage";
import { CallRequestForm, type CallRequestFields } from "./CallRequestForm";

// Owns the whole request-a-call flow so the homepage and /start render the
// same thing. They used to have separate implementations and drifted.
export const CallRequestPanel: React.FC<{
  initialFirstName?: string;
  initialBusinessName?: string;
}> = ({ initialFirstName, initialBusinessName }) => {
  const [phase, setPhase] = useState<"idle" | "dialling" | "ringing">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (fields: CallRequestFields) => {
    setPhase("dialling");
    setError(null);
    try {
      const res = await fetch("/api/voice/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Could not place the call (${res.status})`);
      }
      setPhase("ringing");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <PhoneStage>
        {phase === "ringing" ? (
          <RingingState />
        ) : (
          <CallRequestForm
            busy={phase === "dialling"}
            initialFirstName={initialFirstName}
            initialBusinessName={initialBusinessName}
            onSubmit={handleSubmit}
          />
        )}
      </PhoneStage>
      {error && <p className="text-[12px] text-red-400">{error}</p>}
    </div>
  );
};

const RingingState: React.FC = () => (
  <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/15">
      <span className="h-3 w-3 animate-pulse rounded-full bg-[#22c55e]" />
    </div>
    <h2 className="mt-5 text-[20px] font-bold leading-tight text-white">
      Your phone is ringing
    </h2>
    <p className="mt-2 max-w-[260px] text-[12px] leading-snug text-white/60">
      Answer and Sam will take it from there. Your report lands in your inbox
      within 24 hours of the call.
    </p>
  </div>
);
