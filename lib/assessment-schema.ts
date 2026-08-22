// Shared assessment record for the PRD product (§8). The load-bearing rule:
// what the customer SAID (observations) is stored separately from what Hours
// INFERRED (recommendations), and each stays independently inspectable.

import type { Timestamp } from "firebase-admin/firestore";
import type { WorkflowId } from "./taxonomy";

export const SCHEMA_VERSION = 1;

export type AssessmentTier = "free" | "full";
export type IntakeChannel = "form" | "phone";

// Ranges everywhere: the PRD forbids false precision. null means "not sure",
// which is an allowed first-class answer.
export interface HoursRange {
  minHoursPerWeek: number;
  maxHoursPerWeek: number;
}

export interface UsdRange {
  minUsd: number;
  maxUsd: number;
}

// ---- What the customer said ----

export interface WorkflowObservation {
  id: string;
  workflowId: WorkflowId;
  source: IntakeChannel;
  currentProcess: string;
  owner: string | null;
  tools: string[];
  timeRange: HoursRange | null; // null = customer wasn't sure
  desiredOutcome: string | null;
  verbatimQuotes: string[]; // phone channel only; exact customer phrases
  createdAt: Timestamp;
}

// ---- What Hours inferred (Appendix A shape) ----

export type Disposition = "keep_human" | "automate" | "ai" | "hand_off" | "stop";
export type ConfidenceLevel = "high" | "medium" | "low";
export type BenchmarkState =
  | "self_reported"
  | "external_reference"
  | "hours_cohort"
  | "unavailable";

export interface CalculationAssumptions {
  workingWeeksPerYear: number; // visible and editable; default 46
  loadedHourlyCostUsd: number;
  currency: string;
}

export interface EngineRecommendation {
  id: string;
  workflowId: WorkflowId;
  taskLabel: string;
  currentState: string; // customer-stated, summarised
  disposition: Disposition;
  recommendation: string; // plain-language action and why it fits
  toolOrApproach: string | null;
  setupSteps: string[];
  cost: {
    oneTimeUsd: number | null;
    recurringMonthlyUsd: number | null;
    sourceDate: string | null;
  };
  impact: {
    recoverableRange: HoursRange;
    annualValueRange: UsdRange;
    revenueUpsideNote: string | null; // never mixed into time savings
  };
  evidence: {
    customerQuotes: string[];
    externalSources: { title: string; url: string; date: string }[];
    benchmarkState: BenchmarkState;
  };
  confidence: { level: ConfidenceLevel; reason: string };
  agentPrompt: string | null;
  assumptions: CalculationAssumptions;
}

// ---- Report ----

export interface FreeReportV1 {
  kind: "free_v1";
  version: number;
  workflowId: WorkflowId;
  workflowLabel: string;
  statedOutcome: string | null;
  currentTimeRange: HoursRange | null;
  recommendation: EngineRecommendation;
  nextSteps: string[];
  markdown: string; // same facts, machine-readable rendering
  generatedAt: Timestamp;
  flaggedForReview: boolean;
  flagReasons: string[];
}

// ---- Consent (FR-11) ----

export interface ConsentRecord {
  assessmentId: string;
  channel: IntakeChannel;
  kind: "ai_call" | "form_terms";
  textVersion: string;
  text: string;
  grantedAt: Timestamp;
  ip: string | null;
  userAgent: string | null;
}

// ---- Locale (FR-08) ----

export interface AssessmentLocale {
  country: string | null;
  timezone: string | null;
  currency: string; // ISO code; defaults to USD
}

// Fields the PRD flow adds to the existing assessment document. Kept as an
// extension interface so legacy documents stay valid.
export interface AssessmentPrdFields {
  schemaVersion: number;
  tier: AssessmentTier;
  channel: IntakeChannel | null;
  selectedWorkflows: WorkflowId[];
  locale: AssessmentLocale;
  parentAssessmentId: string | null; // free -> full carry-forward
  consentIds: string[];
}
