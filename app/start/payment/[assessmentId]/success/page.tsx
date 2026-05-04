import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { ProgressBar } from "@/components/start/ProgressBar";

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
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[760px] items-center px-[clamp(16px,4vw,48px)] py-[clamp(24px,5vw,72px)]">
      <div className="w-full border border-[#27272a] bg-black/90 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="border border-[#27272a] bg-black px-[clamp(20px,3vw,40px)] py-[clamp(36px,6vw,72px)]">
          <ProgressBar step={3} done />
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center gap-1.5">
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-green-500">
                Payment received
              </p>
            </div>
            <h1
              className="mb-5 font-extrabold tracking-tighter text-white"
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
              }}
            >
              You&rsquo;re all set.
            </h1>
            <p className="mx-auto max-w-[460px] text-[15px] leading-[1.6] text-white/65">
              Our team is writing your report now. We&rsquo;ll email it to{" "}
              {clientEmail ? (
                <span className="text-white/80">{clientEmail}</span>
              ) : (
                "the address you provided"
              )}{" "}
              when it&rsquo;s ready, with a link to view it and book a follow-up
              call.
            </p>
            <p className="mx-auto mt-6 max-w-[460px] text-[14px] leading-[1.6] text-white/45">
              Reports usually take a few hours. If you don&rsquo;t see anything
              within 24 hours, check spam or write to hi@gethours.org.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
