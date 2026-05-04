import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin, AdminAuthError } from "@/lib/admin-auth";
import type { AssessmentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing assessment id" }, { status: 400 });
  }

  const docRef = adminDb().collection("assessments").doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const data = snap.data() as Record<string, unknown>;
  const currentStatus = data.status as AssessmentStatus | undefined;

  if (currentStatus !== "pending_processing") {
    return NextResponse.json(
      { error: "Not in pending_processing", status: currentStatus ?? null },
      { status: 409 },
    );
  }

  await docRef.update({
    status: "processing" satisfies AssessmentStatus,
    queuedForProcessingAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, status: "processing" as AssessmentStatus });
}
