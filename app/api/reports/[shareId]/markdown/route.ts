// Markdown twin of the report (FR-31). Same shareId gate as the visual page.

import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await params;
  const snap = await adminDb().collection("publicReports").doc(shareId).get();
  const markdown = snap.data()?.markdown;
  if (typeof markdown !== "string" || markdown.length === 0) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="hours-assessment-${shareId}.md"`,
    },
  });
}
