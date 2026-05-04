"use client";

import { useState } from "react";

interface Props {
  assessmentId: string;
  priceLabel: string;
}

export const PayButton: React.FC<Props> = ({ assessmentId, priceLabel }) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#C05A3E] px-5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#A84A30] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Redirecting…" : `Pay ${priceLabel}`}
      </button>
      {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}
    </>
  );
};
