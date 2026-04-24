"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "other", label: "Other" },
];

export const HeroForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [language, setLanguage] = useState("es");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    // MVP: store locally. Wire to a real endpoint post-validation.
    try {
      const record = {
        language,
        phone: phone.trim(),
        ts: new Date().toISOString(),
      };
      const prev = JSON.parse(
        localStorage.getItem("clario_waitlist") ?? "[]"
      );
      localStorage.setItem(
        "clario_waitlist",
        JSON.stringify([...prev, record])
      );
    } catch {
      /* ignore */
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="mt-8 flex items-center gap-3 rounded-lg px-5 py-4"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--olive-soft)",
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--olive)" }}
        >
          <Check size={16} strokeWidth={2.5} className="text-[var(--bg-cream)]" />
        </div>
        <p className="text-[15px]" style={{ color: "var(--ink)" }}>
          Got it. We'll call you back within 24 hours — or we won't ask again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <label className="sr-only" htmlFor="clario-language">
          Language
        </label>
        <select
          id="clario-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md bg-[var(--bg-card)] px-4 py-[14px] text-[15px] sm:w-44"
          style={{
            border: "1px solid var(--olive-soft)",
            color: "var(--ink)",
          }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="clario-phone">
          Phone number
        </label>
        <input
          id="clario-phone"
          type="tel"
          required
          placeholder="+34 600 000 000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 rounded-md bg-[var(--bg-card)] px-4 py-[14px] text-[15px] placeholder:text-[color:var(--ink-faint)]"
          style={{
            border: "1px solid var(--olive-soft)",
            color: "var(--ink)",
          }}
        />

        <button
          type="submit"
          className="group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-6 py-[14px] text-[15px] font-bold text-[var(--bg-cream)] transition-colors duration-150"
          style={{ background: "var(--terracotta)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--terracotta-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--terracotta)")
          }
        >
          Get my call back
          <ArrowRight
            size={16}
            strokeWidth={2.5}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </button>
      </div>

      <p
        className="mt-3 text-[13px]"
        style={{ color: "var(--ink-faint)" }}
      >
        This is the language we'll call you in. We call within 24 hours, or we
        don't ask for your number again.
      </p>
    </form>
  );
};
