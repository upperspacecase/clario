"use client";

import { useCallback, useState } from "react";

export type CallRequestFields = {
  firstName: string;
  businessName: string;
  website: string;
  email: string;
  phone: string;
  workflowId: string;
};

// Match the server checks in app/api/voice/call/route.ts. Twilio needs a full
// country code; a bare national number silently dials the wrong country.
export const E164 = /^\+[1-9]\d{7,14}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CallPhase = "idle" | "dialling" | "ringing";

export function useCallRequest() {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (fields: CallRequestFields) => {
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

  return { phase, error, submit };
}
