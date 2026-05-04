import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { BookingPicker } from "@/components/BookingPicker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublicReportDoc = {
  shareId?: string;
  assessmentId?: string;
  clientName?: string;
  businessName?: string;
  executiveSummary?: string;
};

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  const snap = await adminDb().collection("publicReports").doc(shareId).get();

  // If the report isn't ready yet (e.g., admin previewing), fall back to
  // hydrating the picker from the assessments doc that owns the shareId.
  let report: PublicReportDoc | null = snap.exists ? (snap.data() as PublicReportDoc) : null;

  let assessmentId = report?.assessmentId ?? "";
  let clientName = report?.clientName ?? "";
  let clientEmail = "";

  if (!assessmentId) {
    const aSnap = await adminDb()
      .collection("assessments")
      .where("shareId", "==", shareId)
      .limit(1)
      .get();
    if (aSnap.empty) {
      notFound();
    }
    const a = aSnap.docs[0];
    assessmentId = a.id;
    const aData = a.data();
    clientName = clientName || (aData.clientName as string | null) || (aData.firstName as string | null) || "";
    clientEmail = (aData.clientEmail as string | null) ?? "";
  } else {
    // Pull email from the assessment doc (publicReports doesn't store it).
    try {
      const aSnap = await adminDb().collection("assessments").doc(assessmentId).get();
      if (aSnap.exists) {
        clientEmail = (aSnap.data()?.clientEmail as string | null) ?? "";
      }
    } catch {}
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-[clamp(20px,5vw,48px)] pb-20 pt-[clamp(32px,6vw,64px)]">
      {report ? (
        <article className="space-y-6">
          <h1
            className="font-display font-black"
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 1.02,
              letterSpacing: "-0.015em",
            }}
          >
            {report.businessName ? `${report.businessName}'s Hours report` : "Your Hours report"}
          </h1>
          {report.clientName ? (
            <p className="text-[15px]" style={{ color: "var(--ink-soft, #5a5448)" }}>
              Hi {report.clientName},
            </p>
          ) : null}
          {report.executiveSummary ? (
            <p className="text-[16px] leading-[1.65]" style={{ color: "var(--ink-soft, #5a5448)" }}>
              {report.executiveSummary}
            </p>
          ) : null}
        </article>
      ) : (
        <article className="space-y-4">
          <h1
            className="font-display font-black"
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 1.02,
              letterSpacing: "-0.015em",
            }}
          >
            Your report is being prepared
          </h1>
          <p className="text-[15px] leading-[1.6]" style={{ color: "var(--ink-soft, #5a5448)" }}>
            We'll email you when it's ready (within 24 hours). In the meantime,
            you can lock in your free walkthrough below.
          </p>
        </article>
      )}

      <BookingPicker
        shareId={shareId}
        assessmentId={assessmentId}
        clientName={clientName}
        clientEmail={clientEmail}
      />
    </main>
  );
}
