"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { clientAuth, googleProvider } from "@/lib/firebase-client";

export default function AdminSignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(clientAuth(), (user) => {
      if (user) router.replace("/admin");
    });
  }, [router]);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithPopup(clientAuth(), googleProvider);
      router.replace("/admin");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError(null);
      } else {
        setError(`Sign-in failed${code ? ` (${code})` : ""}.`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-headline-md text-on-surface">Admin sign-in</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Sign in with the authorized Google account to view assessments.
        </p>
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in with Google"}
        </button>
        {error ? (
          <p className="mt-4 text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
