"use client";

import { useEffect, useMemo, useState } from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { PROMISES } from "@/lib/promises";

const WEEKS_PER_YEAR = 52;

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

const DEFAULTS = { hoursPerWeek: 6, teamSize: 12, hourlyRate: 45 };

interface EstimateResponse {
  hoursPerWeek?: number;
  teamSize?: number;
  hourlyRate?: number;
  source?: "transcript" | "fallback";
}

export const CheckoutCalculator: React.FC<{
  assessmentId: string;
  costUsd: number;
}> = ({ assessmentId, costUsd }) => {
  const [loading, setLoading] = useState(true);
  const [hoursPerWeek, setHoursPerWeek] = useState(DEFAULTS.hoursPerWeek);
  const [teamSize, setTeamSize] = useState(DEFAULTS.teamSize);
  const [hourlyRate, setHourlyRate] = useState(DEFAULTS.hourlyRate);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/assessments/${assessmentId}/estimate-numbers`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as EstimateResponse;
        if (cancelled) return;
        if (typeof data.hoursPerWeek === "number") setHoursPerWeek(data.hoursPerWeek);
        if (typeof data.teamSize === "number") setTeamSize(data.teamSize);
        if (typeof data.hourlyRate === "number") setHourlyRate(data.hourlyRate);
        setSourceLabel(
          data.source === "transcript"
            ? "Estimated from your call — adjust if needed."
            : "Defaults — adjust to fit your team.",
        );
      } catch {
        if (!cancelled) {
          setSourceLabel("Defaults — adjust to fit your team.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const savingsPerYear = useMemo(
    () => hoursPerWeek * teamSize * WEEKS_PER_YEAR * hourlyRate,
    [hoursPerWeek, teamSize, hourlyRate],
  );

  const multiple = costUsd > 0 ? savingsPerYear / costUsd : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[#27272a] bg-black/40 px-4 py-10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-[#A28A43]" />
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
          Estimating your savings…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#27272a] bg-black/40 p-4 md:p-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A28A43]">
        What you stand to recover
      </p>
      {sourceLabel && (
        <p className="mb-4 text-[11px] leading-snug text-white/45">
          {sourceLabel}
        </p>
      )}

      <div className="space-y-5">
        <Slider
          label="Hours / week / person on repetitive work"
          value={hoursPerWeek}
          min={1}
          max={40}
          display={`${hoursPerWeek} hrs`}
          onChange={setHoursPerWeek}
        />
        <Slider
          label="Team size"
          value={teamSize}
          min={1}
          max={50}
          display={String(teamSize)}
          onChange={setTeamSize}
        />
        <Slider
          label="Average hourly rate"
          value={hourlyRate}
          min={20}
          max={200}
          display={`$${hourlyRate}`}
          onChange={setHourlyRate}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            Your cost
          </span>
          <p className="mt-1 font-serif text-[28px] leading-none text-white">
            {fmtUsd(costUsd)}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A28A43]">
            Recoverable / year
          </span>
          <p className="mt-1 font-serif text-[28px] leading-none text-[#E8C77A]">
            {fmtUsd(savingsPerYear)}
          </p>
          {multiple >= 2 && (
            <p className="mt-1 text-[11px] text-white/55">
              {Math.round(multiple)}× your investment
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 border-t border-white/5 pt-3 text-[11px] leading-snug text-white/50">
        <span className="text-white/70">{PROMISES.guaranteeLabel}.</span>{" "}
        {PROMISES.guaranteeSentence}
      </p>
    </div>
  );
};

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  display: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, display, onChange }) => (
  <div>
    <div className="mb-2 flex items-baseline justify-between">
      <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
        {label}
      </label>
      <span className="text-[14px] font-medium text-[#E8C77A]">{display}</span>
    </div>
    <RadixSlider.Root
      className="relative flex h-5 w-full touch-none select-none items-center"
      value={[value]}
      min={min}
      max={max}
      step={1}
      onValueChange={(v) => onChange(v[0] ?? min)}
      aria-label={label}
    >
      <RadixSlider.Track className="relative h-[2px] w-full grow bg-white/10">
        <RadixSlider.Range className="absolute h-full bg-[#A28A43]" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="block h-3.5 w-3.5 rounded-full bg-[#A28A43] shadow-[0_0_8px_rgba(162,138,67,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A28A43]/60" />
    </RadixSlider.Root>
  </div>
);
