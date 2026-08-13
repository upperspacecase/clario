// Canonical customer-facing promise strings. Every surface that makes a claim
// to a customer (marketing copy, in-call UI, Sam's prompt, emails, report
// page) imports from here so promises stay aligned. See docs/PROMISES.md.

export const PROMISES = {
  callDurationLabel: "Phone call, as long as you need",
  callDurationSentence:
    "Sam rings you and you talk for as long as it's useful — some calls run twenty minutes, some over an hour.",
  reportSlaLabel: "within 24 hours",
  reportSlaSentence: "Your report will land in your inbox within 24 hours.",
  followUpLabel: "free 60-minute implementation walkthrough + Q&A",
  followUpSentence:
    "Once your report is ready, you can book a free 60-minute walkthrough where we go through it together and answer your questions.",
  priceLabel: "$1,000 one-time",
  guaranteeLabel: "10× ROI guarantee",
  guaranteeSentence:
    "If your report's dollar value of recovered time doesn't exceed $10,000/year, full refund — and you keep the report.",
  slaGuaranteeLabel: "24h or it's free",
  slaGuaranteeSentence:
    "Your report lands within 24 hours of your call ending — or the assessment is free.",
} as const;
