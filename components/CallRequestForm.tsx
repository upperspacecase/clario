"use client";

import { useState } from "react";
import Image from "next/image";
import { Phone } from "lucide-react";
import { PhoneInput } from "./CallScreen";
import { PROMISES } from "@/lib/promises";

export type CallRequestFields = {
  firstName: string;
  businessName: string;
  website: string;
  email: string;
  phone: string;
};

// Matches the server check in app/api/voice/call/route.ts. Twilio needs a full
// country code; a bare national number silently dials the wrong country.
const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CallRequestForm: React.FC<{
  busy: boolean;
  initialFirstName?: string;
  initialBusinessName?: string;
  onSubmit: (fields: CallRequestFields) => void;
}> = ({ busy, initialFirstName = "", initialBusinessName = "", onSubmit }) => {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const normalizedPhone = phone.replace(/[\s()-]/g, "");
  const canSubmit =
    firstName.trim().length > 0 &&
    businessName.trim().length > 0 &&
    EMAIL.test(email.trim()) &&
    E164.test(normalizedPhone) &&
    !busy;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      firstName: firstName.trim(),
      businessName: businessName.trim(),
      website: website.trim(),
      email: email.trim(),
      phone: normalizedPhone,
    });
  };

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 pb-8 pt-8">
      <Image
        src="/hrs-logo-light.png"
        alt="hrs"
        width={696}
        height={358}
        priority
        className="h-9 w-auto"
      />

      <div className="mt-5 text-center">
        <h2 className="text-[20px] font-bold leading-tight text-white">
          Get your assessment
        </h2>
        <p className="mx-auto mt-1.5 max-w-[260px] text-[12px] leading-snug text-white/60">
          Sam rings you straight away and talks through where your week goes.
        </p>
      </div>

      <div className="mt-5 flex w-full flex-col gap-3">
        <PhoneInput
          label="First name"
          autoComplete="given-name"
          value={firstName}
          onChange={setFirstName}
          onEnter={submit}
        />
        <PhoneInput
          label="Business name"
          autoComplete="organization"
          value={businessName}
          onChange={setBusinessName}
          onEnter={submit}
        />
        <PhoneInput
          label="Website"
          autoComplete="url"
          placeholder="acme.co.nz"
          value={website}
          onChange={setWebsite}
          onEnter={submit}
        />
        <PhoneInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@acme.co.nz"
          value={email}
          onChange={setEmail}
          onEnter={submit}
        />
        <PhoneInput
          label="Phone (with country code)"
          type="tel"
          autoComplete="tel"
          placeholder="+64 21 123 4567"
          value={phone}
          onChange={setPhone}
          onEnter={submit}
        />
      </div>

      <div className="mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          aria-label="Call me now"
          className="hours-call-btn relative flex h-[68px] w-[68px] items-center justify-center rounded-full transition-transform duration-150 hover:scale-[1.04] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          style={{
            background: "#22c55e",
            boxShadow: canSubmit
              ? "0 0 32px rgba(34, 197, 94, 0.55), 0 0 64px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
              : "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <Phone size={26} strokeWidth={2.25} fill="white" className="text-white" />
        </button>
        <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
          {busy ? "Dialling…" : "Call me now"}
        </p>
        <p className="mt-2 max-w-[240px] text-center text-[11px] leading-snug text-white/40">
          {PROMISES.callDurationSentence}
        </p>
      </div>
    </div>
  );
};
