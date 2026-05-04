"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PROMISES } from "@/lib/promises";

const SYDNEY_TZ = "Australia/Sydney";

type Slot = { id: string; startMs: number; endMs: number };

function fmtDayHeading(ms: number) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(ms));
}

function fmtTime(ms: number) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

function dayKey(ms: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SYDNEY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

export function BookingPicker(props: {
  shareId: string;
  assessmentId: string;
  clientName: string;
  clientEmail: string;
}) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [name, setName] = useState(props.clientName);
  const [email, setEmail] = useState(props.clientEmail);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ startMs: number; endMs: number } | null>(null);

  const loadSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings/book?days=7", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { slots: Slot[] };
      setSlots(data.slots);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      setSlots([]);
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const grouped = useMemo(() => {
    if (!slots) return [];
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const k = dayKey(s.startMs);
      const arr = map.get(k) ?? [];
      arr.push(s);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .map(([key, items]) => ({
        key,
        headerMs: items[0].startMs,
        items: items.sort((a, b) => a.startMs - b.startMs),
      }))
      .sort((a, b) => a.headerMs - b.headerMs);
  }, [slots]);

  const handleSubmit = useCallback(async () => {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selected.id,
          name,
          email,
          assessmentId: props.assessmentId,
          shareId: props.shareId,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setConfirmed({ startMs: selected.startMs, endMs: selected.endMs });
        return;
      }
      if (data?.reason === "already_booked") {
        setSubmitError("Just taken — please pick another time.");
        setSelected(null);
        await loadSlots();
        return;
      }
      setSubmitError(data?.reason ?? `Booking failed (${res.status}).`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }, [selected, name, email, notes, props.assessmentId, props.shareId, loadSlots]);

  if (confirmed) {
    return (
      <section
        className="mt-12 rounded-xl p-6"
        style={{
          background: "var(--bg-card, #FBF7EB)",
          border: "1px solid var(--olive-soft, rgba(162,138,67,0.34))",
        }}
      >
        <h2
          className="font-display text-[24px] font-bold"
          style={{ color: "var(--ink, #1E1A14)" }}
        >
          Booked
        </h2>
        <p className="mt-3 text-[15px]" style={{ color: "var(--ink-soft, #5a5448)" }}>
          See you on <strong>{fmtDayHeading(confirmed.startMs)}</strong> at{" "}
          <strong>{fmtTime(confirmed.startMs)}</strong> – {fmtTime(confirmed.endMs)} (Sydney time).
        </p>
        <p className="mt-2 text-[14px]" style={{ color: "var(--ink-soft, #5a5448)" }}>
          A calendar invite has been sent to {email}.
        </p>
      </section>
    );
  }

  return (
    <section
      className="mt-12 rounded-xl p-6"
      style={{
        background: "var(--bg-card, #FBF7EB)",
        border: "1px solid var(--olive-soft, rgba(162,138,67,0.34))",
      }}
    >
      <h2
        className="font-display text-[24px] font-bold"
        style={{ color: "var(--ink, #1E1A14)" }}
      >
        Book your {PROMISES.followUpLabel}
      </h2>
      <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: "var(--ink-soft, #5a5448)" }}>
        {PROMISES.followUpSentence}
      </p>

      {loadError ? (
        <p className="mt-4 text-sm" style={{ color: "var(--terracotta, #C05A3E)" }}>
          Couldn't load times: {loadError}
        </p>
      ) : null}

      {slots === null ? (
        <p className="mt-6 text-sm" style={{ color: "var(--ink-soft, #5a5448)" }}>
          Loading times…
        </p>
      ) : slots.length === 0 ? (
        <p className="mt-6 text-sm" style={{ color: "var(--ink-soft, #5a5448)" }}>
          We're updating availability — please check back tomorrow.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {grouped.map((g) => (
            <div key={g.key}>
              <h3
                className="text-[13px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--olive, #A28A43)" }}
              >
                {fmtDayHeading(g.headerMs)}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.items.map((s) => {
                  const isSelected = selected?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelected(s)}
                      className="rounded-full border px-4 py-2 text-[14px] font-medium"
                      style={{
                        background: isSelected ? "var(--terracotta, #C05A3E)" : "transparent",
                        color: isSelected ? "var(--bg-cream, #F8F2E6)" : "var(--ink, #1E1A14)",
                        borderColor: isSelected
                          ? "var(--terracotta, #C05A3E)"
                          : "var(--olive-soft, rgba(162,138,67,0.34))",
                      }}
                    >
                      {fmtTime(s.startMs)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected ? (
        <div className="mt-6 space-y-4 border-t pt-6" style={{ borderColor: "var(--olive-soft, rgba(162,138,67,0.34))" }}>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--olive, #A28A43)" }}>
              Selected
            </p>
            <p className="mt-1 text-[15px]" style={{ color: "var(--ink, #1E1A14)" }}>
              {fmtDayHeading(selected.startMs)} · {fmtTime(selected.startMs)} (Sydney)
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--olive, #A28A43)" }}>
                Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-[14px]"
                style={{ background: "var(--bg-cream, #F8F2E6)", borderColor: "var(--olive-soft, rgba(162,138,67,0.34))", color: "var(--ink, #1E1A14)" }}
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--olive, #A28A43)" }}>
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-[14px]"
                style={{ background: "var(--bg-cream, #F8F2E6)", borderColor: "var(--olive-soft, rgba(162,138,67,0.34))", color: "var(--ink, #1E1A14)" }}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--olive, #A28A43)" }}>
              Notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything you'd like to focus on?"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-[14px]"
              style={{ background: "var(--bg-cream, #F8F2E6)", borderColor: "var(--olive-soft, rgba(162,138,67,0.34))", color: "var(--ink, #1E1A14)" }}
            />
          </label>

          {submitError ? (
            <p className="text-sm" style={{ color: "var(--terracotta, #C05A3E)" }}>
              {submitError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !name.trim() || !email.trim()}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold disabled:opacity-60"
            style={{ background: "var(--terracotta, #C05A3E)", color: "var(--bg-cream, #F8F2E6)" }}
          >
            {submitting ? "Booking…" : "Confirm booking"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
