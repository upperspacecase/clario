"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import {
  bulkOpenWeekdaysAction,
  fetchSlotsAction,
  toggleSlotAction,
} from "./actions";

const DAY_COUNT = 14;
const HOUR_START = 9;
const HOUR_END = 18; // exclusive

type Slot = {
  id: string;
  startMs: number;
  endMs: number;
  status: "open" | "booked" | "blocked";
  bookedByName?: string;
};

const SYDNEY_TZ = "Australia/Sydney";

function sydneyYMD(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: SYDNEY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    weekday: map.weekday,
    key: `${map.year}-${map.month}-${map.day}`,
  };
}

function sydneyHourKey(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: SYDNEY_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.hour}:${map.minute}`;
}

function fmtDayHeader(year: number, month: number, day: number) {
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(probe);
}

function buildDayKeys(): { key: string; year: number; month: number; day: number; isWeekend: boolean }[] {
  const out: { key: string; year: number; month: number; day: number; isWeekend: boolean }[] = [];
  const now = new Date();
  for (let i = 0; i < DAY_COUNT; i++) {
    const probe = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const ymd = sydneyYMD(probe);
    out.push({
      key: ymd.key,
      year: ymd.year,
      month: ymd.month,
      day: ymd.day,
      isWeekend: ymd.weekday === "Sat" || ymd.weekday === "Sun",
    });
  }
  return out;
}

function buildHourSlots(): { hour: number; minute: number; label: string }[] {
  const out: { hour: number; minute: number; label: string }[] = [];
  for (let h = HOUR_START; h < HOUR_END; h++) {
    for (const m of [0, 30]) {
      const label = new Intl.DateTimeFormat("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(2024, 0, 1, h, m));
      out.push({ hour: h, minute: m, label });
    }
  }
  return out;
}

// Compute the UTC ms for (sydney YMD, hour, minute) by binary-search on the
// Sydney-formatted hour string. Pure-client, no DST library needed.
function sydneyLocalToUtcMs(year: number, month: number, day: number, hour: number, minute: number): number {
  // Start with naive UTC, then refine using Sydney offset at that instant.
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  // Iterate twice — handles DST transitions correctly in practice.
  let candidate = naiveUtc;
  for (let i = 0; i < 2; i++) {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: SYDNEY_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = fmt.formatToParts(new Date(candidate));
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    const sydAsUtc = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second),
    );
    const offsetMs = sydAsUtc - candidate;
    candidate = naiveUtc - offsetMs;
  }
  return candidate;
}

export function AvailabilityClient() {
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(clientAuth(), (u) => setUser(u)), []);

  const days = useMemo(() => buildDayKeys(), []);
  const hourSlots = useMemo(() => buildHourSlots(), []);

  // Map: `${dayKey}|${HH:MM}` -> Slot (for fast lookup against fetched data)
  const slotIndex = useMemo(() => {
    const map = new Map<string, Slot>();
    for (const s of slots) {
      const d = new Date(s.startMs);
      const ymd = sydneyYMD(d);
      const hk = sydneyHourKey(d);
      map.set(`${ymd.key}|${hk}`, s);
    }
    return map;
  }, [slots]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const fromMs = Date.now() - 60 * 1000;
      const toMs = fromMs + DAY_COUNT * 24 * 60 * 60 * 1000;
      const data = await fetchSlotsAction({ idToken, fromMs, toMs });
      setSlots(data);
      setLoading(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  const handleToggle = useCallback(
    async (dayKey: string, year: number, month: number, day: number, hour: number, minute: number) => {
      if (!user) return;
      const cellKey = `${dayKey}|${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const existing = slotIndex.get(cellKey);
      if (existing?.status === "booked") return;
      setBusy(cellKey);
      try {
        const idToken = await user.getIdToken();
        const desired: "open" | "blocked" = existing?.status === "open" ? "blocked" : "open";
        const startMs = sydneyLocalToUtcMs(year, month, day, hour, minute);
        await toggleSlotAction({
          idToken,
          slotId: existing?.id ?? null,
          startMs,
          desiredStatus: desired,
        });
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [user, slotIndex, refresh],
  );

  const handleBulkOpen = useCallback(async () => {
    if (!user) return;
    setBusy("bulk");
    try {
      const idToken = await user.getIdToken();
      await bulkOpenWeekdaysAction({
        idToken,
        weeks: 4,
        startHour: 10,
        endHour: 14,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [user, refresh]);

  if (!user) {
    return <div className="mt-8 text-sm text-on-surface-variant">Loading…</div>;
  }

  return (
    <div className="mt-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleBulkOpen}
          disabled={busy === "bulk"}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:opacity-60"
        >
          {busy === "bulk" ? "Creating…" : "Open every weekday 10am–2pm next 4 weeks"}
        </button>
        <button
          onClick={() => void refresh()}
          className="rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
        >
          Refresh
        </button>
        <p className="text-xs text-on-surface-variant">
          Click a cell to toggle open/blocked. Booked cells show the booker.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-error/40 bg-error-container p-4 text-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-12 text-center text-sm text-on-surface-variant">Loading slots…</div>
      ) : (
        <div className="overflow-x-auto rounded border border-outline-variant">
          <table className="min-w-full text-[12px]">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant">
                <th className="sticky left-0 z-10 bg-surface-container-low px-3 py-2 text-left font-medium">
                  Day
                </th>
                {hourSlots.map((h) => (
                  <th
                    key={`${h.hour}-${h.minute}`}
                    className="border-l border-outline-variant px-2 py-2 text-center font-normal tabular-nums"
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.key} className="border-t border-outline-variant">
                  <th
                    scope="row"
                    className={
                      "sticky left-0 z-10 px-3 py-2 text-left font-medium " +
                      (d.isWeekend
                        ? "bg-surface-container text-outline"
                        : "bg-surface-container-low text-on-surface")
                    }
                  >
                    {fmtDayHeader(d.year, d.month, d.day)}
                  </th>
                  {hourSlots.map((h) => {
                    const cellKey = `${d.key}|${String(h.hour).padStart(2, "0")}:${String(h.minute).padStart(2, "0")}`;
                    const slot = slotIndex.get(cellKey);
                    const status = slot?.status ?? "blocked";
                    const isBusy = busy === cellKey;
                    let cls =
                      "border-l border-outline-variant px-2 py-2 text-center text-[11px] tabular-nums select-none";
                    let label = "";
                    if (status === "booked") {
                      cls += " bg-primary text-on-primary cursor-default";
                      label = slot?.bookedByName ?? "Booked";
                    } else if (status === "open") {
                      cls += " bg-primary-container/60 text-on-primary-container cursor-pointer hover:bg-primary-container/80";
                      label = "Open";
                    } else {
                      cls += " bg-surface-container-low text-outline cursor-pointer hover:bg-surface-container";
                      label = "—";
                    }
                    if (isBusy) cls += " opacity-50";
                    return (
                      <td key={cellKey} className={cls}>
                        <button
                          type="button"
                          disabled={status === "booked" || isBusy}
                          onClick={() =>
                            void handleToggle(d.key, d.year, d.month, d.day, h.hour, h.minute)
                          }
                          className="block w-full"
                          title={
                            status === "booked"
                              ? `Booked by ${slot?.bookedByName ?? "someone"}`
                              : status === "open"
                                ? "Click to block"
                                : "Click to open"
                          }
                        >
                          {label}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-on-surface-variant">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded bg-primary-container/60" />
          Open
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded bg-primary" />
          Booked
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded bg-surface-container-low border border-outline-variant" />
          Blocked / not offered
        </span>
      </div>
    </div>
  );
}
