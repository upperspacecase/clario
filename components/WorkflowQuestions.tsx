"use client";

// The five-question set for one workflow, shared by the free intake (/assess)
// and the written Full Assessment. Light theme.

import { questionsFor, type WorkflowDef } from "@/lib/taxonomy";

export type WorkflowAnswers = Record<string, string | boolean>;

export const WorkflowQuestions: React.FC<{
  workflow: WorkflowDef;
  answers: WorkflowAnswers;
  onChange: (key: string, value: string | boolean) => void;
}> = ({ workflow, answers, onChange }) => {
  return (
    <div className="flex flex-col gap-6">
      {questionsFor(workflow).map((q) => {
        if (q.kind === "time_range") {
          const notSure = answers.timeNotSure === true;
          return (
            <div key={q.id}>
              <span className="mb-1.5 block text-[14px] font-semibold leading-snug">
                {q.label}
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  disabled={notSure}
                  value={(answers.timeMin as string) ?? ""}
                  onChange={(e) => onChange("timeMin", e.target.value)}
                  placeholder="From"
                  className="h-11 w-24 rounded-xl border border-[#0B3049]/12 bg-white px-3 text-[15px] focus:border-[#16a34a] focus:outline-none disabled:opacity-40"
                />
                <span className="text-[#6B8199]">to</span>
                <input
                  type="number"
                  min={0}
                  disabled={notSure}
                  value={(answers.timeMax as string) ?? ""}
                  onChange={(e) => onChange("timeMax", e.target.value)}
                  placeholder="To"
                  className="h-11 w-24 rounded-xl border border-[#0B3049]/12 bg-white px-3 text-[15px] focus:border-[#16a34a] focus:outline-none disabled:opacity-40"
                />
                <span className="text-[13px] text-[#6B8199]">hrs / week</span>
              </div>
              <label className="mt-2 flex items-center gap-2 text-[13px] text-[#476582]">
                <input
                  type="checkbox"
                  checked={notSure}
                  onChange={(e) => onChange("timeNotSure", e.target.checked)}
                  className="h-4 w-4 accent-[#16a34a]"
                />
                Honestly, not sure — that&apos;s fine
              </label>
            </div>
          );
        }
        const Comp = q.kind === "textarea" ? "textarea" : "input";
        return (
          <label key={q.id} className="flex flex-col gap-1.5">
            <span className="text-[14px] font-semibold leading-snug">
              {q.label}
              {q.optional && (
                <span className="ml-2 text-[11px] font-normal uppercase tracking-widest text-[#6B8199]">
                  optional
                </span>
              )}
            </span>
            <Comp
              value={(answers[q.id] as string) ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                onChange(q.id, e.target.value)
              }
              placeholder={q.placeholder}
              rows={q.kind === "textarea" ? 5 : undefined}
              className="rounded-xl border border-[#0B3049]/12 bg-white px-3.5 py-2.5 text-[15px] leading-[1.5] focus:border-[#16a34a] focus:outline-none"
            />
          </label>
        );
      })}
    </div>
  );
};
