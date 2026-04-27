import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import type { AssessmentStatus } from "@/lib/types";
import { ConfirmForm } from "./ConfirmForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Trade-off note: this route relies on the unguessability of the Firestore-
// generated assessmentId (20+ char random) rather than verifying a JWT, since
// Agent A's call flow does not pass a token through the redirect. Server
// actions in actions.ts perform the writes server-side, so no token reaches
// the client either way.

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function ConfirmPage({ params }: PageProps) {
  const { assessmentId } = await params;

  const docRef = adminDb().collection("assessments").doc(assessmentId);
  const snap = await docRef.get();

  if (!snap.exists) {
    return (
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
        <div className="w-full border border-[#27272a] bg-black/90 p-8 text-white">
          <h1 className="text-2xl font-bold tracking-tight">Assessment not found</h1>
          <p className="mt-3 text-sm text-white/60">
            The link you used does not match an assessment in our records.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-[#A28A43] underline"
          >
            Return home
          </Link>
        </div>
      </main>
    );
  }

  const data = snap.data() as Record<string, unknown>;
  const status = data.status as AssessmentStatus | undefined;

  if (status && status !== "in_call" && status !== "pending_processing") {
    return <ThanksScreen />;
  }

  if (status === "pending_processing" && hasCompleteDetails(data)) {
    return <ThanksScreen />;
  }

  const initial = {
    clientName: (data.clientName as string | null) ?? "",
    clientEmail: (data.clientEmail as string | null) ?? "",
    businessName: (data.businessName as string | null) ?? "",
    industry: (data.industry as string | null) ?? "",
    callerRole: (data.callerRole as string | null) ?? "",
  };

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
      <div className="w-full border border-[#27272a] bg-black/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="border border-[#27272a] bg-black px-6 py-10 sm:px-10 sm:py-14">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A28A43]">
            One last step
          </p>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tighter text-white sm:text-4xl">
            Confirm your details
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-white/60">
            We use these to send your written report and reach you if we have a
            follow-up question. Edit anything Annie misheard.
          </p>
          <ConfirmForm assessmentId={assessmentId} initial={initial} />
        </div>
      </div>
    </main>
  );
}

function hasCompleteDetails(data: Record<string, unknown>): boolean {
  const fields = ["clientName", "clientEmail", "businessName", "industry", "callerRole"];
  return fields.every((f) => {
    const v = data[f];
    return typeof v === "string" && v.trim().length > 0;
  });
}

function ThanksScreen() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
      <div className="w-full border border-[#27272a] bg-black/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="border border-[#27272a] bg-black px-6 py-12 sm:px-10 sm:py-16 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A28A43]">
            Thank you
          </p>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tighter text-white sm:text-4xl">
            Your report is being prepared
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-white/60">
            We will email you the moment it is ready. You can close this window.
          </p>
          <Link
            href="/"
            className="inline-block text-sm text-[#A28A43] underline"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
