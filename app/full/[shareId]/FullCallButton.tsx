"use client";

import { useState } from "react";
import { E164 } from "@/components/use-call-request";

export const FullCallButton: React.FC<{ shareId: string; phoneOnFile: boolean }> = ({
  shareId,
  phoneOnFile,
}) => {
  const [phase, setPhase] = useState<"idle" | "dialling" | "ringing">("idle");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const normalized = phone.replace(/[\s()-]/g, "");
  const needsPhone = !phoneOnFile;
  const canCall = phase === "idle" && (!needsPhone || E164.test(normalized));

  const call = async () => {
    if (!canCall) return;
    setPhase("dialling");
    setError(null);
    try {
      const res = await fetch("/api/full/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId, phone: needsPhone ? normalized : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not place the call");
      setPhase("ringing");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  };

  if (phase === "ringing") {
    return (
      <p className="text-[15px] font-semibold text-[#16a34a]">
        Your phone is ringing — answer and Sam takes it from there.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[340px] flex-col gap-3">
      {needsPhone && (
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+64 21 123 4567"
          className="h-11 rounded-xl border border-[#0B3049]/12 bg-white px-3.5 text-center text-[15px] focus:border-[#16a34a] focus:outline-none"
        />
      )}
      <button
        type="button"
        onClick={call}
        disabled={!canCall}
        className="rounded-full bg-[#16a34a] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {phase === "dialling" ? "Dialling…" : "Call me now"}
      </button>
      {error && <p className="text-[13px] text-[#C2402A]">{error}</p>}
    </div>
  );
};
