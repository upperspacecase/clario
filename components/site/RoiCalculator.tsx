"use client";

import { useMemo, useState } from "react";
import * as RadixSlider from "@radix-ui/react-slider";

const SERVICE_COST = 1000;
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
      <div className="mb-3 flex items-baseline justify-between">
        <label className="font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3]">
          {label}
        </label>
        <span className="font-[Inter] text-base text-primary-container">
          {display}
        </span>
      </div>
      <RadixSlider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? min)}
        aria-label={label}
      >
        <RadixSlider.Track className="relative h-[2px] w-full grow rounded-full bg-white/15">
          <RadixSlider.Range className="absolute h-full rounded-full bg-primary-container" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="block h-4 w-4 rounded-full bg-primary-container shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_2px_6px_rgba(0,0,0,0.4)] transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] active:scale-95"
        />
      </RadixSlider.Root>
    </div>
  );
};

export const RoiCalculator: React.FC = () => {
  const [hoursLost, setHoursLost] = useState(6);
  const [teamSize, setTeamSize] = useState(12);
  const [hourlyCost, setHourlyCost] = useState(45);

  const { hoursPerMonth, costPerMonth } = useMemo(() => {
    const hoursPerMonth = hoursLost * teamSize * WEEKS_PER_MONTH;
    const costPerMonth = hoursPerMonth * hourlyCost;
    return { hoursPerMonth, costPerMonth };
  }, [hoursLost, teamSize, hourlyCost]);

  return (
    <section className="relative border-t border-white/5 bg-[#121212] py-[64px] text-surface-container md:py-[120px]">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="mb-12 md:mb-16 md:w-2/3">
          <h2 className="mb-6 font-serif text-[clamp(28px,5vw,40px)] leading-[1.2] text-surface-container">
            What are those lost hours really costing you?
          </h2>
          <p className="font-[Inter] text-base leading-[1.6] text-[#a3a3a3]">
            Small businesses increasingly report that AI tools and systems help
            them save time, improve productivity, and reduce operating costs.
            Use the calculator to estimate what repetitive admin, slow
            workflows, and poor follow-up may be costing your business each
            month.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="space-y-10 pr-0 md:col-span-5 md:pr-8">
            <Slider
              label="Hours spent on repetitive tasks"
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

          <div className="mt-12 grid grid-cols-1 gap-4 md:col-span-7 md:mt-0">
            <div className="flex flex-col justify-center border border-white/10 bg-white/5 p-8">
              <span className="mb-2 font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-[#737373]">
                Hours / Month
              </span>
              <span className="font-serif text-4xl text-surface-container">
                {Math.round(hoursPerMonth)}{" "}
                <span className="font-sans text-lg text-[#737373]">hrs</span>
              </span>
            </div>
            <div className="flex flex-col justify-center border border-white/10 bg-white/5 p-8">
              <span className="mb-2 font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-[#737373]">
                Cost / Month
              </span>
              <span className="font-serif text-4xl text-surface-container">
                {fmtUsd(costPerMonth)}
              </span>
            </div>
            <div className="flex flex-col justify-center border border-primary-container/30 bg-secondary/10 p-8">
              <span className="mb-2 font-[Inter] text-[13px] font-semibold uppercase tracking-[0.05em] text-secondary-fixed-dim">
                Our Service
              </span>
              <span className="font-serif text-4xl text-secondary-fixed">
                {fmtUsd(SERVICE_COST)}{" "}
                <span className="font-sans text-lg text-secondary-fixed-dim">
                  one-time
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
