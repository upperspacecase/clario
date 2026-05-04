import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getAssessmentPriceCents, isFreePilotMode } from "@/lib/stripe";
import { ProgressBar } from "@/components/start/ProgressBar";
import { PayButton } from "./PayButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_FIELDS = [
  "clientName",
  "clientEmail",
  "businessName",
  "industry",
  "callerRole",
] as const;

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export default async function PaymentPage({ params }: PageProps) {
  const { assessmentId } = await params;

  const docRef = adminDb().collection("assessments").doc(assessmentId);
  const snap = await docRef.get();

  if (!snap.exists) {
    return (
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
        <div className="w-full border border-[#27272a] bg-black/90 p-8 text-white">
          <h1 className="text-2xl font-bold tracking-tight">
            Assessment not found
          </h1>
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

  if (data.paidAt) {
    redirect(`/start/payment/${assessmentId}/success`);
  }

  if (await isFreePilotMode()) {
    redirect(`/start/thanks?id=${assessmentId}`);
  }

  const detailsComplete = REQUIRED_FIELDS.every((f) => {
    const v = data[f];
    return typeof v === "string" && v.trim().length > 0;
  });

  if (!detailsComplete) {
    redirect(`/start/confirm/${assessmentId}`);
  }

  const priceCents = await getAssessmentPriceCents();
  const priceUsd = priceCents / 100;
  const priceLabel = priceUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const businessName = (data.businessName as string | null) ?? "your business";
  const clientEmail = (data.clientEmail as string | null) ?? "";

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
      <div className="w-full border border-[#27272a] bg-black/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="border border-[#27272a] bg-black px-6 py-10 sm:px-10 sm:py-14">
          <ProgressBar step={3} />
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A28A43]">
            Step 3 of 3 — Payment
          </p>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tighter text-white sm:text-4xl">
            Almost there.
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-white/60">
            Pay for your Hours assessment. Our team writes the report and
            emails it to{" "}
            <span className="text-white/80">{clientEmail}</span> — usually
            within a few hours.
          </p>

          <div className="mb-6 border border-[#27272a] bg-black/60 px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                Hours assessment
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                {priceLabel}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-white/45">
              One personalized written report for {businessName}, with a 4-day
              quick-win plan and a free 30-minute follow-up call.
            </p>
          </div>

          <PayButton assessmentId={assessmentId} priceLabel={priceLabel} />

          <p className="mt-4 text-[12px] text-white/40">
            Secure payment via Stripe. You will be redirected to Stripe to
            complete the transaction.
          </p>
        </div>
      </div>
    </main>
  );
}
