import type { Timestamp } from "firebase-admin/firestore";

export type AssessmentStatus =
  | "in_call"
  | "pending_processing"
  | "processing"
  | "manual_review"
  | "complete"
  | "failed";

export interface Headline {
  hoursPerWeek: number;
  monthlyValue: number;
  monthlyToolCost: number;
  netMonthly: number;
  annualized: number;
  hourlyRateUsed: number;
}

export interface FourDayPlanItem {
  day: number;
  action: string;
  toolName: string;
}

export interface Assessment {
  id: string;
  shareId: string;

  // Captured pre-call (Stage 1 form).
  firstName: string | null;
  businessName: string | null;
  website: string | null;
  location: string | null;
  teamSize: string | null;

  // Legacy / post-call fields. clientName mirrors firstName; clientEmail,
  // industry, and callerRole are filled by the post-call confirm form.
  clientName: string | null;
  clientEmail: string | null;
  industry: string | null;
  callerRole: string | null;

  status: AssessmentStatus;

  voiceSessionId: string | null;
  voiceSessionHandles: string[];
  audioStoragePath: string | null;
  callStartedAt: Timestamp | null;
  callEndedAt: Timestamp | null;
  callDurationSec: number | null;

  headline: Headline | null;
  executiveSummary: string | null;
  fourDayPlan: FourDayPlanItem[] | null;

  promptVersionId: string | null;
  pipelineVersionId: string | null;

  createdAt: Timestamp;
  queuedForProcessingAt: Timestamp | null;
  completedAt: Timestamp | null;
  emailedAt: Timestamp | null;

  paidAt: Timestamp | null;
  amountPaidUsd: number | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;

  tayNotes: string | null;
}

export interface TranscriptTurn {
  turnId: string;
  role: "user" | "agent";
  text: string;
  timestamp: Timestamp;
  sessionHandle: string;
  isFinal: boolean;
}

export interface PipelineRun {
  runId: string;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  status: "running" | "success" | "failed";
  triggeredBy: "auto" | "manual_admin" | "cli";
  skillOutputs: Record<
    string,
    {
      durationMs: number;
      success: boolean;
      outputPath: string;
      errorMessage?: string;
    }
  >;
  finalReportPath?: string;
}

export interface PainPoint {
  id: string;
  description: string;
  verbatimQuote: string;
  frequency: string;
  hoursPerWeek: number;
  category: string;
  effortScore: 1 | 2 | 3;
  impactScore: 1 | 2 | 3;
  isQuickWin: boolean;
}

export interface Recommendation {
  id: string;
  painPointId: string;
  toolName: string;
  toolUrl: string;
  pricing: string;
  hasFreeTier: boolean;
  monthlyPrice: number | null;
  whyItFits: string;
  installSteps: string[];
  timeSavedHoursPerWeek: number;
  source: "taaft" | "futuretools" | "web";
  confidence: number;
}

export interface Upsell {
  id: string;
  title: string;
  type:
    | "process_redesign"
    | "automation_build"
    | "knowledge_system"
    | "agent_build"
    | "full_implementation";
  problem: string;
  proposedSolution: string;
  valueRangeMin: number;
  valueRangeMax: number;
  relatedPainPointIds: string[];
}

export interface PublicReport {
  shareId: string;
  assessmentId: string;
  clientName: string;
  businessName: string;
  generatedAt: Timestamp;
  headline: Headline;
  executiveSummary: string;
  painPoints: PainPoint[];
  recommendations: Recommendation[];
  fourDayPlan: FourDayPlanItem[];
  upsells: Upsell[];
  bookingUrl: string;
  expiresAt: Timestamp | null;
}

export interface PublicReportView {
  viewId: string;
  timestamp: Timestamp;
  userAgent: string;
  referrer: string | null;
  ipHash: string;
}

export interface PromptVersion {
  promptId: string;
  version: string;
  systemPrompt: string;
  voiceConfig: {
    voiceName: string;
    speakingRate: number;
  };
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  notes: string;
  metricsSnapshot?: {
    callsRun: number;
    avgPainPointsExtracted: number;
    avgCallDuration: number;
  };
}

export interface ConfigGlobal {
  assessmentPriceUsd: number;
  freePilotMode: boolean;
  maxCallDurationSec: number;
  bookingUrlBase: string;
  notificationEmail: string;
  activePromptId: string;
  updatedAt: Timestamp;
}

export interface VoiceSessionTokenPayload {
  assessmentId: string;
  shareId: string;
  iat: number;
  exp: number;
}
