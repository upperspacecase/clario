"use client";

import { useState, useTransition } from "react";
import { confirmDetails, type ConfirmDetailsInput } from "./actions";

const INDUSTRIES = [
  "Hospitality",
  "Retail",
  "Professional services",
  "Health & wellness",
  "Trades",
  "E-commerce",
  "Real estate",
  "Education",
  "Other",
];

interface Initial {
  clientName: string;
  clientEmail: string;
  businessName: string;
  industry: string;
  callerRole: string;
}

interface Props {
  assessmentId: string;
  initial: Initial;
}

export const ConfirmForm: React.FC<Props> = ({ assessmentId, initial }) => {
  const [values, setValues] = useState<Initial>(initial);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ConfirmDetailsInput, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof Initial>(key: K, value: Initial[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await confirmDetails({
        assessmentId,
        clientName: values.clientName,
        clientEmail: values.clientEmail,
        businessName: values.businessName,
        industry: values.industry,
        callerRole: values.callerRole,
      });
      if (!result?.ok) {
        if (result?.fieldErrors) setErrors(result.fieldErrors);
        if (result?.message) setFormError(result.message);
      }
    });
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <Field
        label="Your name"
        error={errors.clientName}
      >
        <input
          type="text"
          autoComplete="name"
          className={inputClass(Boolean(errors.clientName))}
          value={values.clientName}
          onChange={(e) => update("clientName", e.target.value)}
          disabled={pending}
        />
      </Field>

      <Field
        label="Email"
        hint="We send your report here."
        error={errors.clientEmail}
      >
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          className={inputClass(Boolean(errors.clientEmail))}
          value={values.clientEmail}
          onChange={(e) => update("clientEmail", e.target.value)}
          disabled={pending}
        />
      </Field>

      <Field
        label="Business name"
        error={errors.businessName}
      >
        <input
          type="text"
          autoComplete="organization"
          className={inputClass(Boolean(errors.businessName))}
          value={values.businessName}
          onChange={(e) => update("businessName", e.target.value)}
          disabled={pending}
        />
      </Field>

      <Field
        label="Industry"
        error={errors.industry}
      >
        <select
          className={selectClass(Boolean(errors.industry))}
          value={values.industry}
          onChange={(e) => update("industry", e.target.value)}
          disabled={pending}
        >
          <option value="">Select an industry</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Your role"
        hint="Owner, manager, operator…"
      >
        <input
          type="text"
          autoComplete="organization-title"
          className={inputClass(false)}
          value={values.callerRole}
          onChange={(e) => update("callerRole", e.target.value)}
          disabled={pending}
        />
      </Field>

      {formError && (
        <p className="text-sm text-red-400">{formError}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-3 inline-flex h-12 items-center justify-center rounded-md bg-[#C05A3E] px-5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#A84A30] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Confirm"}
      </button>
    </form>
  );
};

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
        {label}
      </span>
      {children}
      {error ? (
        <span className="text-[12px] text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-[12px] text-white/40">{hint}</span>
      ) : null}
    </label>
  );
}

function inputClass(invalid: boolean): string {
  return [
    "h-11 w-full rounded-md border bg-black/60 px-3 text-[15px] text-white",
    "placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A28A43]",
    invalid ? "border-red-500/70" : "border-[#27272a]",
  ].join(" ");
}

function selectClass(invalid: boolean): string {
  return [
    "h-11 w-full rounded-md border bg-black/60 px-3 text-[15px] text-white",
    "focus:outline-none focus:ring-2 focus:ring-[#A28A43]",
    invalid ? "border-red-500/70" : "border-[#27272a]",
  ].join(" ");
}
