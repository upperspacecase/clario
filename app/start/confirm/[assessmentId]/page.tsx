import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import type { AssessmentStatus } from "@/lib/types";
import { PhoneSteps } from "@/components/PhoneSteps";
import { ConfirmForm } from "./ConfirmForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function ConfirmPage({ params }: PageProps) {
  const { assessmentId } = await params;

  const docRef = adminDb().collection("assessments").doc(assessmentId);
  const snap = await docRef.get();

  if (!snap.exists) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-10 md:px-8">
        <div className="w-full max-w-[520px]">
          <div className="mb-4">
            <PhoneSteps current={2} />
          </div>
          <div className="rounded-lg border border-[#27272a] bg-[#0a0a0a] p-6 md:p-8">
            <h1 className="text-[20px] font-extrabold tracking-tight text-white">
              Assessment not found
            </h1>
            <p className="mt-2 text-[13px] leading-snug text-white/60">
              The link you used does not match an assessment in our records.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-[13px] text-[#A28A43] underline"
            >
              Return home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const data = snap.data() as Record<string, unknown>;
  const status = data.status as AssessmentStatus | undefined;
  const paid = Boolean(data.paidAt);

  if (paid) {
    redirect(`/start/payment/${assessmentId}/success`);
  }

  if (status === "complete") {
    const shareId = (data.shareId as string | undefined) ?? "";
    redirect(shareId ? `/r/${shareId}` : "/");
  }

  const initial = {
    clientName:
      (data.clientName as string | null) ??
      (data.firstName as string | null) ??
      "",
    clientEmail: (data.clientEmail as string | null) ?? "",
    businessName: (data.businessName as string | null) ?? "",
    industry: (data.industry as string | null) ?? "",
    callerRole: (data.callerRole as string | null) ?? "",
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-10 md:px-8">
      <div className="w-full max-w-[520px]">
        <div className="mb-4">
          <PhoneSteps current={2} />
        </div>
        <div className="rounded-lg border border-[#27272a] bg-[#0a0a0a] p-6 md:p-8">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A28A43]">
            Your details
          </p>
          <h1 className="mb-2 text-[22px] font-extrabold tracking-tight text-white">
            Confirm your details
          </h1>
          <p className="mb-5 text-[13px] leading-snug text-white/55">
            We use these to send your written report. Edit anything Sam
            misheard.
          </p>
          <ConfirmForm assessmentId={assessmentId} initial={initial} />
        </div>
      </div>
    </main>
  );
}
