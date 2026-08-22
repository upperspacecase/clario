import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { FullCallButton } from "./FullCallButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FullStartPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const snap = await adminDb()
    .collection("assessments")
    .where("shareId", "==", shareId)
    .limit(1)
    .get();
  if (snap.empty) notFound();
  const a = snap.docs[0].data();
  if (a.tier !== "full") notFound();

  const paid = Boolean(a.paidAt);
  const done = a.status === "complete" || a.status === "manual_review" || a.status === "pending_processing" || a.status === "processing";

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#0B3049]">
      <main className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col justify-center px-5 py-16 text-center">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-[#16a34a]">
          Full Assessment{a.businessName ? ` — ${a.businessName}` : ""}
        </p>
        {!paid ? (
          <>
            <h1 className="mb-3 text-[28px] font-bold tracking-[-0.02em]">
              Payment pending
            </h1>
            <p className="text-[15px] leading-[1.6] text-[#476582]">
              Complete checkout first — the link is in your email, or head back
              to your free report.
            </p>
          </>
        ) : done ? (
          <>
            <h1 className="mb-3 text-[28px] font-bold tracking-[-0.02em]">
              Your call is done
            </h1>
            <p className="text-[15px] leading-[1.6] text-[#476582]">
              Your report is being prepared and lands within 24 hours of the
              call. It arrives by email with your strategy-call booking link.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-3 text-[28px] font-bold tracking-[-0.02em]">
              Ready when you are
            </h1>
            <p className="mb-8 text-[15px] leading-[1.6] text-[#476582]">
              Sam rings you and you talk through all six workflows — about 45
              minutes, at whatever depth suits. Find a quiet moment; there is
              nothing to prepare.
            </p>
            <FullCallButton shareId={shareId} phoneOnFile={Boolean(a.phone)} />
            <p className="mx-auto mt-4 max-w-[380px] text-[11px] leading-snug text-[#6B8199]">
              By tapping Call me now you request a call from Sam, an AI
              interviewer, and agree to transcription so we can prepare your
              report.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
