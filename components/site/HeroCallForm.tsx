"use client";

import { useState } from "react";
import { PROMISES } from "@/lib/promises";
import { WORKFLOWS } from "@/lib/taxonomy";
import {
  E164,
  EMAIL,
  useCallRequest,
  type CallRequestFields,
} from "../use-call-request";

// Light booking-card version of the request-a-call flow, for the homepage
// hero. Same hook and API as /start's dark phone panel.
export const HeroCallForm: React.FC = () => {
  const { phase, error, submit } = useCallRequest();

  return (
    <div className="w-full rounded-[28px] border border-[#0B3049]/8 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(11,48,73,0.25)] md:p-8">
      {phase === "ringing" ? <Ringing /> : <Fields busy={phase === "dialling"} onSubmit={submit} />}
      {error && <p className="mt-3 text-[13px] text-[#C2402A]">{error}</p>}
    </div>
  );
};

const Fields: React.FC<{
  busy: boolean;
  onSubmit: (fields: CallRequestFields) => void;
}> = ({ busy, onSubmit }) => {
  const [firstName, setFirstName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [workflowId, setWorkflowId] = useState("");

  const normalizedPhone = phone.replace(/[\s()-]/g, "");
  const canSubmit =
    firstName.trim().length > 0 &&
    businessName.trim().length > 0 &&
    EMAIL.test(email.trim()) &&
    E164.test(normalizedPhone) &&
    workflowId.length > 0 &&
    !busy;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      firstName: firstName.trim(),
      businessName: businessName.trim(),
      website: website.trim(),
      email: email.trim(),
      phone: normalizedPhone,
      workflowId,
    });
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16a34a]/10">
          <span aria-hidden className="material-symbols-outlined text-[20px] text-[#16a34a]">
            call
          </span>
        </span>
        <div>
          <h2 className="text-[17px] font-bold leading-tight text-[#0B3049]">
            Sam rings you
          </h2>
          <p className="text-[12.5px] text-[#476582]">
            Leave your details and pick up the phone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="First name" autoComplete="given-name" value={firstName} onChange={setFirstName} onEnter={submit} />
        <Field label="Business name" autoComplete="organization" value={businessName} onChange={setBusinessName} onEnter={submit} />
        <Field label="Website" autoComplete="url" placeholder="acme.co" value={website} onChange={setWebsite} onEnter={submit} />
        <Field label="Email" type="email" autoComplete="email" placeholder="you@acme.co" value={email} onChange={setEmail} onEnter={submit} />
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#476582]">
            Which workflow costs you most?
          </span>
          <select
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#0B3049]/12 bg-[#F8F7F4] px-3 text-[15px] text-[#0B3049] focus:border-[#16a34a] focus:bg-white focus:outline-none"
          >
            <option value="">Choose one…</option>
            {WORKFLOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <Field
            label="Phone (with country code)"
            type="tel"
            autoComplete="tel"
            placeholder="+64 21 123 4567"
            value={phone}
            onChange={setPhone}
            onEnter={submit}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="mt-5 w-full rounded-full bg-[#16a34a] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Dialling…" : "Call me now"}
      </button>

      <p className="mt-3 text-center text-[12px] leading-snug text-[#476582]">
        {PROMISES.callDurationSentence}
      </p>
      <p className="mt-2 text-center text-[11px] leading-snug text-[#6B8199]">
        By tapping Call me now you request a call from Sam, an AI interviewer,
        and agree to transcription so we can prepare your assessment.
      </p>
      <p className="mt-2 text-center text-[12px] text-[#6B8199]">
        Prefer to type?{" "}
        <a href="/assess" className="font-semibold text-[#16a34a] underline">
          Take the written assessment
        </a>
      </p>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  autoComplete: string;
  type?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}> = ({ label, value, autoComplete, type = "text", placeholder, onChange, onEnter }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#476582]">
      {label}
    </span>
    <input
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
      className="h-11 w-full rounded-xl border border-[#0B3049]/12 bg-[#F8F7F4] px-3.5 text-[15px] text-[#0B3049] placeholder:text-[#0B3049]/30 focus:border-[#16a34a] focus:bg-white focus:outline-none"
    />
  </label>
);

const Ringing: React.FC = () => (
  <div className="flex flex-col items-center py-10 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#16a34a]/10">
      <span className="h-3 w-3 animate-pulse rounded-full bg-[#16a34a]" />
    </div>
    <h2 className="mt-5 text-[20px] font-bold leading-tight text-[#0B3049]">
      Your phone is ringing
    </h2>
    <p className="mt-2 max-w-[280px] text-[13px] leading-snug text-[#476582]">
      Answer and Sam will take it from there. {PROMISES.freeSlaSentence}
    </p>
  </div>
);
