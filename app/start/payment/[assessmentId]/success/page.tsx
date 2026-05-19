import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { PhoneSteps } from "@/components/PhoneSteps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function PaymentSuccessPage({ params }: PageProps) {
  const { assessmentId } = await params;

  const docRef = adminDb().collection("assessments").doc(assessmentId);
  const snap = await docRef.get();

  if (!snap.exists) {
    redirect("/");
  }

  const data = snap.data() as Record<string, unknown>;
  const clientEmail = (data.clientEmail as string | null) ?? null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-10 md:px-8">
      <div className="w-full max-w-[520px]">
        <div className="mb-4">
          <PhoneSteps current={3} done />
        </div>
        <div className="rounded-lg border border-[#27272a] bg-[#0a0a0a] p-6 text-center md:p-8">
          <div className="mb-4 inline-flex items-center justify-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-500">
              Payment received
            </p>
          </div>
          <h1 className="mb-3 text-[26px] font-extrabold leading-tight tracking-tight text-white">
            You&rsquo;re all set.
          </h1>
          <p className="mx-auto max-w-[380px] text-[14px] leading-snug text-white/65">
            Our team is writing your report now. We&rsquo;ll email it to{" "}
            {clientEmail ? (
              <span className="text-white/80">{clientEmail}</span>
            ) : (
              "the address you provided"
            )}{" "}
            within 24 hours, with a link to view it and book a follow-up call.
          </p>
          <p className="mx-auto mt-4 max-w-[380px] text-[12px] leading-snug text-white/45">
            If you don&rsquo;t see anything within 24 hours, check spam or
            write to hi@gethours.org.
          </p>
        </div>
      </div>
    </main>
  );
}
