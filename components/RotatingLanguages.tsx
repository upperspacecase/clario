"use client";

import { useEffect, useState } from "react";

const LANGS = [
  "English",
  "Hindi",
  "Japanese",
  "German",
  "Chinese",
  "French",
  "Korean",
  "Portuguese",
  "Italian",
  "Spanish",
  "Arabic",
  "Russian",
];

const INTERVAL_MS = 1800;

export const RotatingLanguages: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [i, setI] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const t = setInterval(
      () => setI((x) => (x + 1) % LANGS.length),
      INTERVAL_MS
    );
    return () => clearInterval(t);
  }, []);

  // Invisible longest string reserves width so surrounding copy doesn't reflow.
  const longest = LANGS.reduce((a, b) => (a.length >= b.length ? a : b));

  return (
    <span
      className={`relative inline-flex overflow-hidden align-bottom ${className ?? ""}`}
      style={{ height: "1.15em" }}
      aria-live="polite"
    >
      <span
        className="block transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: `translateY(-${i * 1.15}em)` }}
      >
        {LANGS.map((l) => (
          <span
            key={l}
            className="block font-bold text-white"
            style={{ height: "1.15em", lineHeight: "1.15em" }}
          >
            {l}
          </span>
        ))}
      </span>
      {/* Width reservation */}
      <span className="invisible font-bold" aria-hidden>
        {longest}
      </span>
    </span>
  );
};
