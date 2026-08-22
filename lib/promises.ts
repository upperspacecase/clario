// Canonical customer-facing promise strings. Every surface that makes a claim
// to a customer (marketing copy, in-call UI, Sam's prompt, emails, report
// page) imports from here so promises stay aligned. See docs/PROMISES.md and
// the Hours PRD v1.0 (offer architecture, §5).

export const PROMISES = {
  // Free Assessment — one workflow
  freeOfferLabel: "Free assessment of one workflow",
  freeCallSentence:
    "About ten minutes on the phone, focused on the workflow costing you most.",
  freeSlaLabel: "within 1 hour",
  freeSlaSentence:
    "Your one-page assessment lands in your inbox within 1 hour of the call.",

  // Full Assessment — $497, all six workflows
  fullPriceLabel: "$497 one-time",
  fullDurationLabel: "45 minutes across all six workflows",
  fullSlaLabel: "within 24 hours",
  fullSlaSentence: "Your full report lands in your inbox within 24 hours.",

  // Used by the intake forms under the call button; the phone flow is the
  // free assessment, so this describes the free call.
  callDurationSentence:
    "About ten minutes on the phone — Sam focuses on the one workflow costing you most.",

  followUpLabel: "included 30-minute strategy call",
  followUpSentence:
    "Once your report is ready, you can book the included 30-minute strategy call where we go through it together and agree what happens next.",

  guaranteeLabel: "The $10,000 guarantee",
  guaranteeSentence:
    "If your Full Assessment does not identify at least $10,000 per year in recoverable time, you get a full refund — and you keep the assessment.",
} as const;
