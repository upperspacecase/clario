type Step = 1 | 2 | 3;

interface Props {
  step: Step;
  done?: boolean;
}

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Call" },
  { n: 2, label: "Details" },
  { n: 3, label: "Payment" },
];

export const ProgressBar: React.FC<Props> = ({ step, done = false }) => {
  return (
    <div
      className="mb-8 flex items-center gap-2"
      aria-label={`Step ${step} of 3`}
      role="group"
    >
      {STEPS.map((s, i) => {
        const state =
          done || s.n < step
            ? "complete"
            : s.n === step
              ? "current"
              : "pending";
        return (
          <div key={s.n} className="flex flex-1 items-center gap-2">
            <Pill state={state} number={s.n} label={s.label} />
            {i < STEPS.length - 1 && <Connector active={s.n < step || done} />}
          </div>
        );
      })}
    </div>
  );
};

function Pill({
  state,
  number,
  label,
}: {
  state: "complete" | "current" | "pending";
  number: Step;
  label: string;
}) {
  const ring =
    state === "current"
      ? "border-[#A28A43] text-[#A28A43]"
      : state === "complete"
        ? "border-[#A28A43] bg-[#A28A43] text-black"
        : "border-white/20 text-white/35";
  const labelColor =
    state === "current"
      ? "text-white"
      : state === "complete"
        ? "text-white/80"
        : "text-white/35";
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${ring}`}
      >
        {state === "complete" ? "✓" : number}
      </span>
      <span
        className={`text-[11px] font-bold uppercase tracking-[0.16em] ${labelColor}`}
      >
        {label}
      </span>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <span
      className={`h-px flex-1 ${active ? "bg-[#A28A43]" : "bg-white/15"}`}
    />
  );
}
