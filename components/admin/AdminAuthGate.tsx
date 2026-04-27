"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";

const ALLOWED_EMAIL = "tay@life-time.co";

type AuthState =
  | { kind: "loading" }
  | { kind: "signed_out" }
  | { kind: "denied"; user: User }
  | { kind: "allowed"; user: User };

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>({ kind: "loading" });

  useEffect(() => {
    return onAuthStateChanged(clientAuth(), (user) => {
      if (!user) {
        setState({ kind: "signed_out" });
        return;
      }
      if (user.email === ALLOWED_EMAIL && user.emailVerified) {
        setState({ kind: "allowed", user });
      } else {
        setState({ kind: "denied", user });
      }
    });
  }, []);

  useEffect(() => {
    if (state.kind === "signed_out" && pathname !== "/admin/sign-in") {
      router.replace("/admin/sign-in");
    }
  }, [state.kind, pathname, router]);

  if (pathname === "/admin/sign-in") {
    return <>{children}</>;
  }

  if (state.kind === "loading" || state.kind === "signed_out") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-sm text-on-surface-variant">Loading…</div>
      </div>
    );
  }

  if (state.kind === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-headline-md text-on-surface">Not authorized</h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            {state.user.email ?? "This account"} doesn't have access to the admin panel.
          </p>
          <button
            onClick={() => signOut(clientAuth())}
            className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary hover:bg-primary/90"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
