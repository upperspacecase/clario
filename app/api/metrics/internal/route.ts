import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.METRICS_INTERNAL_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const header = request.headers.get("authorization") || "";
  if (header !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const [doneSnap, sentSnap] = await Promise.all([
    db.collection("assessments").where("completedAt", "!=", null).count().get(),
    db.collection("assessments").where("emailedAt", "!=", null).count().get(),
  ]);

  return NextResponse.json({
    assessmentsDone: doneSnap.data().count,
    reportsSent: sentSnap.data().count,
  });
}
