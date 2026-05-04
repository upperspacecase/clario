type Step = 1 | 2 | 3;

interface Props {
  current: Step;
  done?: boolean;
}

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Call" },
  { n: 2, label: "Payment" },
  { n: 3, label: "Results" },
];

export const PhoneSteps: React.FC<Props> = ({ current, done = false }) => {
  return (
    <div
      className="flex items-center gap-1 px-4 pb-2 pt-1"
      role="group"
      aria-label={`Step ${current} of 3`}
    >
      {STEPS.map((s, i) => {
        const state =
          done || s.n < current
            ? "complete"
            : s.n === current
              ? "current"
              : "pending";
        return (
          <div key={s.n} className="flex flex-1 items-center gap-1">
            <Pill state={state} number={s.n} label={s.label} />
            {i < STEPS.length - 1 && (
              <Connector active={s.n < current || done} />
            )}
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
        ? "text-white/70"
        : "text-white/30";
  return (
    <div className="flex items-center gap-1 whitespace-nowrap">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[8px] font-bold ${ring}`}
      >
        {state === "complete" ? "✓" : number}
      </span>
      <span
        className={`text-[9px] font-bold uppercase tracking-[0.14em] ${labelColor}`}
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
