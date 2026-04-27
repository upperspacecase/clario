"use client";

import { useState } from "react";
import { Signal, Wifi, BatteryMedium } from "lucide-react";

export type PreCallFormValues = {
  firstName: string;
  businessName: string;
  website: string;
  location: string;
  teamSize: string;
};

export type PreCallFormProps = {
  onSubmit: (values: PreCallFormValues) => Promise<void> | void;
  submitting?: boolean;
  errorMessage?: string | null;
};

const TEAM_SIZES = ["Just me", "2–5", "6–10", "11–25", "26–50", "50+"];

const LOCATIONS = [
  "Australia",
  "New Zealand",
  "United States",
  "United Kingdom",
  "Canada",
  "Ireland",
  "Singapore",
  "India",
  "South Africa",
  "Germany",
  "France",
  "Netherlands",
  "Spain",
  "Italy",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Japan",
  "Hong Kong",
  "United Arab Emirates",
  "Mexico",
  "Brazil",
  "Other",
];

const DEFAULTS: PreCallFormValues = {
  firstName: "",
  businessName: "",
  website: "",
  location: "",
  teamSize: "",
};

type FieldKey = keyof PreCallFormValues;

export const PreCallForm: React.FC<PreCallFormProps> = ({
  onSubmit,
  submitting = false,
  errorMessage,
}) => {
  const [values, setValues] = useState<PreCallFormValues>(DEFAULTS);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  function update<K extends FieldKey>(key: K, value: PreCallFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): Partial<Record<FieldKey, string>> {
    const next: Partial<Record<FieldKey, string>> = {};
    const fn = values.firstName.trim();
    if (fn.length < 2 || fn.length > 30) {
      next.firstName = "2–30 characters.";
    }
    if (!values.businessName.trim()) next.businessName = "Required.";
    if (!values.location) next.location = "Required.";
    if (!values.teamSize) next.teamSize = "Required.";
    if (values.website.trim()) {
      const candidate = /^https?:\/\//i.test(values.website.trim())
        ? values.website.trim()
        : `https://${values.website.trim()}`;
      try {
        const u = new URL(candidate);
        if (!u.hostname.includes(".")) next.website = "Doesn't look like a URL.";
      } catch {
        next.website = "Doesn't look like a URL.";
      }
    }
    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    void onSubmit({
      ...values,
      firstName: values.firstName.trim(),
      businessName: values.businessName.trim(),
      website: values.website.trim(),
    });
  }

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: "#0a0a0a", color: "#fff" }}
    >
      <div className="flex items-center justify-between px-6 pb-2 pt-1 text-[13px] font-bold text-white">
        <span>9:41</span>
        <div className="flex items-center gap-1" aria-hidden>
          <Signal size={13} strokeWidth={2.5} />
          <Wifi size={13} strokeWidth={2.5} />
          <BatteryMedium size={18} strokeWidth={2.2} />
        </div>
      </div>

      <div className="px-6 pb-2 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
          About you
        </p>
        <p className="mt-0.5 text-[18px] font-extrabold tracking-tight text-white">
          A few quick details
        </p>
        <p className="mt-1 text-[12px] leading-snug text-white/50">
          So Annie can skip the basics and dig into what matters.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-5 pb-3 pt-1">
          <div className="flex flex-col gap-3">
            <Field label="First name" error={errors.firstName}>
              <input
                type="text"
                autoComplete="given-name"
                className={inputClass(Boolean(errors.firstName))}
                value={values.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                disabled={submitting}
              />
            </Field>

            <Field label="Business name" error={errors.businessName}>
              <input
                type="text"
                autoComplete="organization"
                className={inputClass(Boolean(errors.businessName))}
                value={values.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                disabled={submitting}
              />
            </Field>

            <Field label="Location" error={errors.location}>
              <select
                autoComplete="country-name"
                className={selectClass(Boolean(errors.location))}
                value={values.location}
                onChange={(e) => update("location", e.target.value)}
                disabled={submitting}
              >
                <option value="">Select…</option>
                {LOCATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Team size" error={errors.teamSize}>
              <select
                className={selectClass(Boolean(errors.teamSize))}
                value={values.teamSize}
                onChange={(e) => update("teamSize", e.target.value)}
                disabled={submitting}
              >
                <option value="">Select…</option>
                {TEAM_SIZES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Website"
              hint="Optional"
              compact
              error={errors.website}
            >
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="example.com"
                className={compactInputClass(Boolean(errors.website))}
                value={values.website}
                onChange={(e) => update("website", e.target.value)}
                disabled={submitting}
              />
            </Field>

            {errorMessage && (
              <p className="mt-1 text-[12px] text-red-400">{errorMessage}</p>
            )}
          </div>
        </div>

        <div className="border-t border-white/8 px-5 pb-5 pt-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center rounded-md bg-[#22c55e] px-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0a0a0a] shadow-[0_8px_18px_rgba(34,197,94,0.35)] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Connecting…" : "Call now"}
          </button>
        </div>
      </form>
    </div>
  );
};

function Field({
  label,
  hint,
  error,
  compact,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col ${compact ? "gap-0.5" : "gap-1"}`}>
      <span
        className={
          compact
            ? "text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35"
            : "text-[10px] font-bold uppercase tracking-[0.16em] text-white/55"
        }
      >
        {label}
      </span>
      {children}
      {error ? (
        <span className="text-[11px] text-red-400">{error}</span>
      ) : hint ? (
        <span
          className={
            compact ? "text-[10px] text-white/30" : "text-[11px] text-white/40"
          }
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function inputClass(invalid: boolean): string {
  return [
    "h-10 w-full rounded-md border bg-black/60 px-3 text-[14px] text-white",
    "placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#22c55e]",
    invalid ? "border-red-500/70" : "border-white/12",
  ].join(" ");
}

function selectClass(invalid: boolean): string {
  return [
    "h-10 w-full rounded-md border bg-black/60 px-3 text-[14px] text-white",
    "focus:outline-none focus:ring-2 focus:ring-[#22c55e]",
    invalid ? "border-red-500/70" : "border-white/12",
  ].join(" ");
}

function compactInputClass(invalid: boolean): string {
  return [
    "h-8 w-full rounded-md border bg-black/40 px-2.5 text-[12px] text-white/80",
    "placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[#22c55e]/70",
    invalid ? "border-red-500/70" : "border-white/8",
  ].join(" ");
}
