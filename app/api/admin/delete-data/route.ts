// Customer deletion requests (PRD §11). Removes the substantive data and
// anonymises the assessment shell; consent records are retained as proof of
// lawful processing, per the published privacy policy.

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin, AdminAuthError } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function deleteSubcollection(
  ref: FirebaseFirestore.DocumentReference,
  name: string,
): Promise<number> {
  const snap = await ref.collection(name).get();
  let n = 0;
  for (const doc of snap.docs) {
    await doc.ref.delete();
    n++;
  }
  return n;
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    const status = e instanceof AdminAuthError ? e.status : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const body = await req.json().catch(() => ({}));
  const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId : "";
  if (!assessmentId) return NextResponse.json({ error: "assessmentId required" }, { status: 400 });

  const db = adminDb();
  const ref = db.collection("assessments").doc(assessmentId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const a = snap.data() as Record<string, unknown>;

  const deleted = {
    transcript: await deleteSubcollection(ref, "transcript"),
    observations: await deleteSubcollection(ref, "observations"),
    recommendations: await deleteSubcollection(ref, "recommendations"),
    publicReport: 0,
    events: 0,
  };

  const shareId = a.shareId as string | undefined;
  if (shareId) {
    const reportRef = db.collection("publicReports").doc(shareId);
    if ((await reportRef.get()).exists) {
      await deleteSubcollection(reportRef, "views");
      await reportRef.delete();
      deleted.publicReport = 1;
    }
  }

  const events = await db.collection("events").where("assessmentId", "==", assessmentId).get();
  for (const doc of events.docs) {
    await doc.ref.delete();
    deleted.events++;
  }

  // Anonymise the shell; keep the doc so payment/audit references resolve.
  await ref.update({
    firstName: null,
    businessName: null,
    website: null,
    clientName: null,
    clientEmail: null,
    phone: null,
    tayNotes: "DATA DELETED ON REQUEST",
    headline: null,
    executiveSummary: null,
    fourDayPlan: null,
    dataDeletedAt: FieldValue.serverTimestamp(),
  });

  console.log(`[delete-data] assessment=${assessmentId}`, deleted);
  return NextResponse.json({ ok: true, deleted });
}
