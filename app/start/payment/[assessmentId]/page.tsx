import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getAssessmentPriceCents, isFreePilotMode } from "@/lib/stripe";
import { PhoneSteps } from "@/components/PhoneSteps";
import { CheckoutCalculator } from "@/components/CheckoutCalculator";
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
    <main className="flex min-h-screen items-center justify-center bg-[#121212] px-5 py-10 md:px-8">
      <div className="w-full max-w-[520px]">
        <div className="mb-4">
          <PhoneSteps current={2} />
        </div>
        <div className="rounded-lg border border-[#27272a] bg-[#0a0a0a] p-6 md:p-8">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A28A43]">
            Payment
          </p>
          <h1 className="mb-2 text-[22px] font-extrabold tracking-tight text-white">
            Almost there.
          </h1>
          <p className="mb-5 text-[13px] leading-snug text-white/55">
            Pay for your Hours assessment. Our team writes the report and emails
            it to <span className="text-white/80">{clientEmail}</span> within 24
            hours.
          </p>

          <div className="mb-5 border border-[#27272a] bg-black/60 px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                Hours assessment
              </span>
              <span className="text-[20px] font-extrabold tracking-tight text-white">
                {priceLabel}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-white/45">
              One personalized written report for {businessName}, with a 4-day
              quick-win plan and a free 60-minute follow-up call.
            </p>
          </div>

          <div className="mb-5">
            <CheckoutCalculator
              assessmentId={assessmentId}
              costUsd={priceUsd}
            />
          </div>

          <PayButton assessmentId={assessmentId} priceLabel={priceLabel} />

          <p className="mt-3 text-[11px] text-white/40">
            Secure payment via Stripe. You will be redirected to Stripe to
            complete the transaction.
          </p>
        </div>
      </div>
    </main>
  );
}
