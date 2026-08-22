// Benchmark references (PRD §10.2). The collection starts EMPTY on purpose:
// a reference may only be added with a real source, date and geography, via
// research — never generated. Until eligible references exist, the engine
// runs in "Your estimate" mode and the comparison layer stays hidden.

import { adminDb } from "./firebase-admin";
import type { WorkflowId } from "./taxonomy";

export interface BenchmarkRef {
  id: string;
  workflowId: WorkflowId;
  metric: string; // e.g. "hours_per_week_lead_followup"
  geography: string; // ISO country code or "global"
  source: string;
  sourceUrl: string;
  sourceDate: string; // ISO date of the source material
  range: { min: number; max: number; unit: string };
  note: string | null;
}

export async function getEligibleBenchmarks(
  workflowId: WorkflowId,
  country: string | null,
): Promise<BenchmarkRef[]> {
  const snap = await adminDb()
    .collection("benchmarks")
    .where("workflowId", "==", workflowId)
    .get();
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BenchmarkRef);
  // Geography gate: a reference applies to the customer's country or is
  // explicitly global. Mismatched references are suppressed, not stretched.
  return all.filter(
    (b) => b.geography === "global" || (country !== null && b.geography === country),
  );
}
