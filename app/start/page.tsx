"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CallRequestPanel } from "@/components/CallRequestPanel";

export default function StartPage() {
  return (
    <Suspense fallback={null}>
      <StartInner />
    </Suspense>
  );
}

function StartInner() {
  const searchParams = useSearchParams();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-10 md:px-8">
      <div className="w-full max-w-[420px]">
        <CallRequestPanel
          initialFirstName={(searchParams.get("firstName") ?? "").trim()}
          initialBusinessName={(searchParams.get("businessName") ?? "").trim()}
        />
      </div>
    </main>
  );
}
