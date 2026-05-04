"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import {
  cancelBookingAction,
  fetchUpcomingBookingsAction,
  type AdminBookingRow,
} from "./actions";

const SYDNEY_TZ = "Australia/Sydney";

function fmtSydney(ms: number) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

function fmtSydneyTimeOnly(ms: number) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

export function BookingsClient() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(clientAuth(), (u) => setUser(u)), []);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const data = await fetchUpcomingBookingsAction({ idToken });
      setRows(data);
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

  const handleCancel = useCallback(
    async (slotId: string) => {
      if (!user) return;
      if (!confirm("Cancel this booking and email the customer?")) return;
      setBusyId(slotId);
      try {
        const idToken = await user.getIdToken();
        await cancelBookingAction({ idToken, slotId });
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusyId(null);
      }
    },
    [user, refresh],
  );

  if (!user) {
    return <div className="mt-8 text-sm text-on-surface-variant">Loading…</div>;
  }

  return (
    <div className="mt-8">
      {error ? (
        <div className="mb-4 rounded border border-error/40 bg-error-container p-4 text-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-12 text-center text-sm text-on-surface-variant">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-on-surface-variant">
          No upcoming bookings.
        </div>
      ) : (
        <div className="border-t border-outline-variant/60">
          {rows.map((r) => (
            <div
              key={r.slotId}
              className="flex flex-wrap items-start gap-4 border-b border-outline-variant/60 py-4"
            >
              <div className="w-44 flex-shrink-0">
                <div className="text-[15px] font-medium text-on-surface">
                  {fmtSydney(r.startMs)}
                </div>
                <div className="text-xs text-on-surface-variant">
                  → {fmtSydneyTimeOnly(r.endMs)} (Sydney)
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-medium text-on-surface">
                  {r.clientName}{" "}
                  <span className="text-on-surface-variant">&lt;{r.clientEmail}&gt;</span>
                </div>
                <div className="text-sm text-on-surface-variant">
                  {r.businessName ?? "—"}
                </div>
                {r.notes ? (
                  <div className="mt-1 text-[13px] italic text-on-surface-variant">
                    "{r.notes}"
                  </div>
                ) : null}
              </div>

              <div className="flex flex-shrink-0 flex-col gap-1 text-right text-sm">
                <Link
                  href={`/r/${r.shareId}`}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Report →
                </Link>
                <Link
                  href={`/admin/r/${r.assessmentId}`}
                  className="text-on-surface-variant underline-offset-2 hover:underline"
                >
                  Admin →
                </Link>
                <button
                  type="button"
                  onClick={() => void handleCancel(r.slotId)}
                  disabled={busyId === r.slotId}
                  className="mt-1 rounded-full border border-outline-variant px-3 py-1 text-[12px] text-on-surface-variant hover:bg-surface-container disabled:opacity-60"
                >
                  {busyId === r.slotId ? "Cancelling…" : "Cancel"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
