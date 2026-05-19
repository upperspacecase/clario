"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import { MODELS, VOICES, type ModelId, type VoiceId } from "@/lib/agent-options";
import {
  activatePromptAction,
  deletePromptAction,
  fetchPromptAction,
  updatePromptAction,
} from "./actions";

type FormState = {
  name: string;
  prompt: string;
  voice: VoiceId;
  model: ModelId;
};

export function PromptEditor({ id }: { id: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(clientAuth(), (u) => setUser(u)), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const data = await fetchPromptAction({ idToken, id });
        if (cancelled) return;
        if (!data.prompt) {
          setError("Prompt not found");
          setLoading(false);
          return;
        }
        setForm({
          name: data.prompt.name,
          prompt: data.prompt.prompt,
          voice: data.prompt.voice,
          model: data.prompt.model,
        });
        setActiveId(data.activePromptId);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  const handleSave = useCallback(async () => {
    if (!user || !form) return;
    setBusy("save");
    setInfo(null);
    try {
      const idToken = await user.getIdToken();
      await updatePromptAction({ idToken, id, ...form });
      setInfo("Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [user, form, id]);

  const handleActivate = useCallback(async () => {
    if (!user) return;
    setBusy("activate");
    setInfo(null);
    try {
      const idToken = await user.getIdToken();
      await activatePromptAction({ idToken, id });
      setActiveId(id);
      setInfo("Activated. New calls will use this prompt.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [user, id]);

  const handleDelete = useCallback(async () => {
    if (!user) return;
    if (!confirm("Delete this prompt? This cannot be undone.")) return;
    setBusy("delete");
    setInfo(null);
    try {
      const idToken = await user.getIdToken();
      await deletePromptAction({ idToken, id });
      router.push("/admin/prompts");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }, [user, id, router]);

  const isActive = activeId === id;

  return (
    <>
      <header className="flex items-end justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <Link
            href="/admin/prompts"
            className="text-sm text-on-surface-variant hover:text-on-surface"
          >
            ← Prompts
          </Link>
          <h1 className="mt-2 font-display text-headline-md text-on-surface">
            {form?.name || (loading ? "Loading…" : "Prompt")}
          </h1>
          {isActive && (
            <p className="mt-1 inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-on-primary">
              Active
            </p>
          )}
        </div>
      </header>

      {error && (
        <div className="mt-6 rounded border border-error/40 bg-error-container p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}
      {info && (
        <div className="mt-6 rounded border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant">
          {info}
        </div>
      )}

      {form && (
        <div className="mt-6 space-y-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                Voice
              </label>
              <select
                value={form.voice}
                onChange={(e) =>
                  setForm({ ...form, voice: e.target.value as VoiceId })
                }
                className="mt-1 w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                {VOICES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                Model
              </label>
              <select
                value={form.model}
                onChange={(e) =>
                  setForm({ ...form, model: e.target.value as ModelId })
                }
                className="mt-1 w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              Prompt (system instruction)
            </label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={28}
              className="mt-1 w-full rounded border border-outline-variant bg-surface-container-low p-3 font-mono text-[13px] leading-snug text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant/60 pt-6">
            <button
              onClick={handleSave}
              disabled={busy !== null}
              className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {busy === "save" ? "Saving…" : "Save"}
            </button>
            {!isActive && (
              <button
                onClick={handleActivate}
                disabled={busy !== null}
                className="inline-flex items-center rounded-full border border-outline-variant bg-surface-container-low px-5 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              >
                {busy === "activate" ? "Activating…" : "Make active"}
              </button>
            )}
            <div className="ml-auto">
              <button
                onClick={handleDelete}
                disabled={busy !== null || isActive}
                title={isActive ? "Cannot delete the active prompt" : ""}
                className="inline-flex items-center rounded-full border border-error/40 px-5 py-2 text-sm font-medium text-error hover:bg-error-container disabled:opacity-50"
              >
                {busy === "delete" ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
