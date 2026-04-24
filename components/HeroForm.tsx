"use client";

import { useState } from "react";
import { Phone, ArrowRight } from "lucide-react";

export const HeroForm: React.FC = () => {
  const [state, setState] = useState<"idle" | "notice">("idle");

  const handleCall = () => {
    setState("notice");
  };

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={handleCall}
        className="group inline-flex items-center gap-3 rounded-full px-7 py-[18px] text-[16px] font-bold text-[var(--bg-cream)] transition-all duration-150"
        style={{
          background: "var(--terracotta)",
          boxShadow: "0 10px 24px rgba(192, 90, 62, 0.35)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--terracotta-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "var(--terracotta)")
        }
      >
        <Phone size={18} strokeWidth={2.5} />
        Call now
        <ArrowRight
          size={16}
          strokeWidth={2.5}
          className="transition-transform duration-150 group-hover:translate-x-0.5"
        />
      </button>

      <p
        className="mt-3 text-[13px]"
        style={{ color: "var(--ink-faint)" }}
      >
        Five minutes. Answer in your own language. Get a written report.
      </p>

      {state === "notice" && (
        <div
          className="mt-5 max-w-md rounded-lg px-4 py-3 text-[14px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--olive-soft)",
            color: "var(--ink)",
          }}
        >
          Voice agent prototype launching shortly. For the demo, the live
          call button will open a browser microphone session.
        </div>
      )}
    </div>
  );
};
