"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import { MODELS, VOICES } from "@/lib/agent-options";
import {
  activatePromptAction,
  createPromptAction,
  fetchPromptsAction,
} from "./actions";

type PromptRow = {
  id: string;
  name: string;
  voice: string;
  model: string;
  updatedAt: number;
};

export function PromptsClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<PromptRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(clientAuth(), (u) => setUser(u)), []);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const data = await fetchPromptsAction({ idToken });
      setRows(
        data.prompts.map((p) => ({
          id: p.id,
          name: p.name,
          voice: p.voice,
          model: p.model,
          updatedAt: p.updatedAt,
        })),
      );
      setActiveId(data.activePromptId);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  const handleNew = useCallback(async () => {
    if (!user) return;
    setBusy("new");
    try {
      const idToken = await user.getIdToken();
      const created = await createPromptAction({
        idToken,
        name: "New prompt",
        prompt: "You are an AI interviewer. Listen more than you talk.",
        voice: VOICES[0],
        model: MODELS[0],
      });
      router.push(`/admin/prompts/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }, [user, router]);

  const handleActivate = useCallback(
    async (id: string) => {
      if (!user) return;
      setBusy(id);
      try {
        const idToken = await user.getIdToken();
        await activatePromptAction({ idToken, id });
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [user, refresh],
  );

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          {loading ? "Loading…" : `${rows.length} prompt${rows.length === 1 ? "" : "s"}`}
        </p>
        <button
          onClick={handleNew}
          disabled={!user || busy === "new"}
          className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:opacity-50"
        >
          {busy === "new" ? "Creating…" : "New prompt"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-error/40 bg-error-container p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="py-12 text-center text-sm text-on-surface-variant">
          No prompts yet. Run <code>npm run seed:prompt</code> or create one above.
        </div>
      )}

      {rows.length > 0 && (
        <div className="divide-y divide-outline-variant/60 border-t border-outline-variant/60">
          {rows.map((row) => {
            const isActive = row.id === activeId;
            return (
              <div
                key={row.id}
                className="flex items-center gap-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/prompts/${row.id}`}
                    className="block font-medium text-on-surface hover:underline"
                  >
                    {row.name || "(unnamed)"}
                  </Link>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    voice={row.voice} · model={row.model}
                    {row.updatedAt > 0 && (
                      <> · updated {new Date(row.updatedAt).toLocaleString()}</>
                    )}
                  </p>
                </div>
                {isActive ? (
                  <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-on-primary">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => handleActivate(row.id)}
                    disabled={busy === row.id}
                    className="inline-flex items-center rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                  >
                    {busy === row.id ? "Activating…" : "Make active"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
