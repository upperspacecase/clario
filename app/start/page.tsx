"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PhoneStage } from "@/components/PhoneStage";
import { CallRequestForm, type CallRequestFields } from "@/components/CallRequestForm";

type CallResponse = {
  assessmentId: string;
  shareId: string;
  callSid: string;
};

export default function StartPage() {
  return (
    <Suspense fallback={null}>
      <StartInner />
    </Suspense>
  );
}

function StartInner() {
  const searchParams = useSearchParams();
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
      (await res.json()) as CallResponse;
      setPhase("ringing");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-10 md:px-8">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
        <PhoneStage>
          {phase === "ringing" ? (
            <RingingState />
          ) : (
            <CallRequestForm
              busy={phase === "dialling"}
              initialFirstName={(searchParams.get("firstName") ?? "").trim()}
              initialBusinessName={(searchParams.get("businessName") ?? "").trim()}
              onSubmit={handleSubmit}
            />

          )}
        </PhoneStage>
        {error && <p className="text-[12px] text-red-400">{error}</p>}
      </div>
    </main>
  );
}

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
