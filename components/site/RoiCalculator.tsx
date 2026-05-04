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
        <label className="font-[Inter] text-[11px] font-semibold uppercase tracking-widest text-[#a3a3a3]">
          {label}
        </label>
        <span className="font-[Inter] text-base text-primary-container">
          {display}
        </span>
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
        <RadixSlider.Track className="relative h-[2px] w-full grow bg-white/10">
          <RadixSlider.Range className="absolute h-full bg-primary-container" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="block h-4 w-4 rounded-full bg-primary-container shadow-[0_0_10px_rgba(201,169,110,0.3)] transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] active:scale-95"
        />
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
    <section className="relative border-t border-white/5 py-[80px] text-surface-container md:py-[120px]">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="mb-12 md:mb-16 md:w-2/3">
          <h2 className="mb-6 font-serif text-[clamp(28px,5vw,40px)] leading-[1.2] text-white">
            What are those lost hours really costing you?
          </h2>
          <p className="max-w-2xl font-[Inter] text-base leading-relaxed text-[#a3a3a3] md:text-lg">
            Small businesses increasingly report that AI tools and systems help
            them save time, improve productivity, and reduce operating costs.
            Use the calculator to estimate what repetitive admin, slow
            workflows, and poor follow-up may be costing your business each
            month.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
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

          <div className="mt-12 flex flex-col gap-4 md:col-span-7 md:mt-0">
            <div className="flex flex-col justify-center border border-white/5 bg-[#1f1f1f] p-8">
              <span className="mb-3 font-[Inter] text-[11px] font-semibold uppercase tracking-widest text-[#737373]">
                Hours / Month
              </span>
              <span className="font-serif text-[40px] leading-none text-white">
                {Math.round(hoursPerMonth)}{" "}
                <span className="ml-1 font-sans text-xl text-[#737373]">
                  hrs
                </span>
              </span>
            </div>
            <div className="flex flex-col justify-center border border-white/5 bg-[#1f1f1f] p-8">
              <span className="mb-3 font-[Inter] text-[11px] font-semibold uppercase tracking-widest text-[#737373]">
                Cost / Month
              </span>
              <span className="font-serif text-[40px] leading-none text-white">
                {fmtUsd(costPerMonth)}
              </span>
            </div>
            <div className="flex flex-col justify-center border border-white/5 bg-[#1f1f1f] p-8">
              <span className="mb-3 font-[Inter] text-[11px] font-semibold uppercase tracking-widest text-[#737373]">
                Savings / Year
              </span>
              <span className="font-serif text-[40px] leading-none text-white">
                {fmtUsd(savingsPerYear)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
