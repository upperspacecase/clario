"use client";

import { useMemo, useState } from "react";
import * as RadixSlider from "@radix-ui/react-slider";

const WEEKS_PER_MONTH = 52 / 12;

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, display, onChange }) => {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#476582]">
          {label}
        </label>
        <span className="text-base font-semibold text-[#0B3049]">{display}</span>
      </div>
      <RadixSlider.Root
        className="relative flex h-6 w-full touch-none select-none items-center"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? min)}
        aria-label={label}
      >
        <RadixSlider.Track className="relative h-[3px] w-full grow rounded-full bg-[#0B3049]/10">
          <RadixSlider.Range className="absolute h-full rounded-full bg-[#16a34a]" />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="block h-4 w-4 rounded-full bg-[#16a34a] shadow-[0_2px_8px_rgba(22,163,74,0.4)] transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95" />
      </RadixSlider.Root>
    </div>
  );
};

export const RoiCalculator: React.FC = () => {
  const [hoursLost, setHoursLost] = useState(6);
  const [teamSize, setTeamSize] = useState(12);
  const [hourlyCost, setHourlyCost] = useState(45);

  const { hoursPerMonth, costPerMonth, savingsPerYear } = useMemo(() => {
    const hoursPerMonth = hoursLost * teamSize * WEEKS_PER_MONTH;
    const costPerMonth = hoursPerMonth * hourlyCost;
    const savingsPerYear = costPerMonth * 12;
    return { hoursPerMonth, costPerMonth, savingsPerYear };
  }, [hoursLost, teamSize, hourlyCost]);

  return (
    <section className="relative py-[80px] md:py-[120px]">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-12 md:mb-16 md:w-2/3">
          <h2 className="mb-5 text-[clamp(28px,4.5vw,44px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#0B3049]">
            What are those lost hours costing you?
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-[#476582] md:text-lg">
            Small businesses increasingly report that AI tools and systems help
            them save time, improve productivity, and reduce operating costs.
            Use the calculator to estimate what repetitive admin, slow
            workflows, and poor follow-up may be costing your team each
            month. All figures are estimates from your inputs, not guaranteed
            savings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 rounded-[28px] border border-[#0B3049]/6 bg-white p-8 md:grid-cols-12 md:p-12">
          <div className="space-y-12 pr-0 pt-4 md:col-span-5 md:pr-8">
            <Slider
              label="Hours spent on repetitive tasks per week"
              value={hoursLost}
              min={0}
              max={20}
              display={`${hoursLost} hrs`}
              onChange={setHoursLost}
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
              value={hourlyCost}
              min={20}
              max={150}
              display={`$${hourlyCost}`}
              onChange={setHourlyCost}
            />
          </div>

          <div className="mt-4 flex flex-col gap-4 md:col-span-7 md:mt-0">
            <div className="flex flex-col justify-center rounded-2xl bg-[#F6F4EF] p-7">
              <span className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#6B8199]">
                Estimated hours / month
              </span>
              <span className="text-[36px] font-bold leading-none tracking-[-0.02em] text-[#0B3049]">
                {Math.round(hoursPerMonth)}{" "}
                <span className="ml-1 text-lg font-medium text-[#6B8199]">hrs</span>
              </span>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-[#F6F4EF] p-7">
              <span className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#6B8199]">
                Estimated cost / month
              </span>
              <span className="text-[36px] font-bold leading-none tracking-[-0.02em] text-[#0B3049]">
                {fmtUsd(costPerMonth)}
              </span>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-[#DDF2E4] p-7">
              <span className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#15803d]">
                Estimated savings / year
              </span>
              <span className="text-[36px] font-bold leading-none tracking-[-0.02em] text-[#15803d]">
                {fmtUsd(savingsPerYear)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
