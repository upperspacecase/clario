// Canonical customer-facing promise strings. Every surface that makes a claim
// to a customer (marketing copy, in-call UI, Annie's prompt, emails, report
// page) imports from here so promises stay aligned. See docs/PROMISES.md.

export const PROMISES = {
  callDurationLabel: "30-minute conversation",
  callDurationSentence:
    "About 30 minutes, with a checkpoint mid-way to wrap or keep going.",
  reportSlaLabel: "within 24 hours",
  reportSlaSentence: "Your report will land in your inbox within 24 hours.",
  followUpLabel: "free 30-minute implementation walkthrough + Q&A",
  followUpSentence:
    "Once your report is ready, you can book a free 30-minute walkthrough where we go through it together and answer your questions.",
  priceLabel: "$1,000 one-time",
} as const;
