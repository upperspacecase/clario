"use client";

import { useState } from "react";

const INDUSTRIES = [
  "Hospitality",
  "Retail",
  "Professional services",
  "Health & wellness",
  "Trades",
  "E-commerce",
  "Real estate",
  "Education",
  "Software / SaaS",
  "Marketing / Agency",
  "Other",
];

type Errors = Partial<Record<"clientName" | "clientEmail" | "businessName" | "industry" | "callerRole", string>>;

export type StartFormValues = {
  clientName: string;
  clientEmail: string;
  businessName: string;
  industry: string;
  callerRole: string;
};

type StartFormProps = {
  onSubmit: (values: StartFormValues) => Promise<void> | void;
  submitting: boolean;
  outerError: string | null;
};

export const StartForm: React.FC<StartFormProps> = ({ onSubmit, submitting, outerError }) => {
  const [values, setValues] = useState<StartFormValues>({
    clientName: "",
    clientEmail: "",
    businessName: "",
    industry: "",
    callerRole: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const update = (field: keyof StartFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!values.clientName.trim()) next.clientName = "Required";
    if (!values.clientEmail.trim()) next.clientEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.clientEmail.trim())) next.clientEmail = "Invalid email";
    if (!values.businessName.trim()) next.businessName = "Required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onSubmit({
      clientName: values.clientName.trim(),
      clientEmail: values.clientEmail.trim().toLowerCase(),
      businessName: values.businessName.trim(),
      industry: values.industry.trim(),
      callerRole: values.callerRole.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-3 text-left">
      <Field label="Your first name" error={errors.clientName}>
        <input
          type="text"
          autoComplete="given-name"
          value={values.clientName}
          onChange={update("clientName")}
          disabled={submitting}
          className="w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-green-500"
          placeholder="Tay"
        />
      </Field>
      <Field label="Email" error={errors.clientEmail}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.clientEmail}
          onChange={update("clientEmail")}
          disabled={submitting}
          className="w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-green-500"
          placeholder="you@business.com"
        />
      </Field>
      <Field label="Business name" error={errors.businessName}>
        <input
          type="text"
          autoComplete="organization"
          value={values.businessName}
          onChange={update("businessName")}
          disabled={submitting}
          className="w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-green-500"
          placeholder="Acme Co"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Industry">
          <select
            value={values.industry}
            onChange={update("industry")}
            disabled={submitting}
            className="w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-[14px] text-white outline-none focus:border-green-500"
          >
            <option value="">Select…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Your role">
          <input
            type="text"
            autoComplete="organization-title"
            value={values.callerRole}
            onChange={update("callerRole")}
            disabled={submitting}
            className="w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-green-500"
            placeholder="Owner"
          />
        </Field>
      </div>

      {outerError && (
        <p className="text-[12px] text-red-400" role="alert">
          {outerError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex w-full items-center justify-center rounded bg-green-500 px-4 py-2.5 text-[14px] font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Connecting…" : "Start the call"}
      </button>
      <p className="text-[11px] text-white/40">
        Annie greets you by name and asks about your business — about 20–30 minutes. Microphone permission required.
      </p>
    </form>
  );
};

const Field: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
      {label}
    </span>
    {children}
    {error && <span className="mt-1 block text-[11px] text-red-400">{error}</span>}
  </label>
);
