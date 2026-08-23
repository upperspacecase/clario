"use client";

import { PhoneStage } from "./PhoneStage";
import { CallRequestForm } from "./CallRequestForm";
import { useCallRequest } from "./use-call-request";
import { PROMISES } from "@/lib/promises";

// Owns the whole request-a-call flow inside the dark phone chrome. Used by
// /start; the homepage renders the same flow via HeroCallForm.
export const CallRequestPanel: React.FC<{
  initialFirstName?: string;
  initialBusinessName?: string;
}> = ({ initialFirstName, initialBusinessName }) => {
  const { phase, error, submit, reset } = useCallRequest();

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <PhoneStage>
        {phase === "ringing" && <RingingState onRetry={reset} />}
        <div className={phase === "ringing" ? "hidden" : "flex flex-1 flex-col"}>
          <CallRequestForm
            busy={phase === "dialling"}
            initialFirstName={initialFirstName}
            initialBusinessName={initialBusinessName}
            onSubmit={submit}
          />
        </div>
      </PhoneStage>
      {error && <p className="text-[12px] text-red-400">{error}</p>}
    </div>
  );
};

const RingingState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/15">
      <span className="h-3 w-3 animate-pulse rounded-full bg-[#22c55e]" />
    </div>
    <h2 className="mt-5 text-[20px] font-bold leading-tight text-white">
      Your phone is ringing
    </h2>
    <p className="mt-2 max-w-[260px] text-[12px] leading-snug text-white/60">
      Answer and Sam will take it from there. {PROMISES.freeSlaSentence}
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 text-[12px] font-semibold text-[#22c55e] underline"
    >
      Missed the call? Try again
    </button>
  </div>
);
