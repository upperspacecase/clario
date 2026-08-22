const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface ResendAttachment {
  filename: string;
  content: string; // base64
  content_type?: string;
}

interface ResendPayload {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: ResendAttachment[];
}

async function sendViaResend(payload: ResendPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping send");
    return;
  }
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
}

// ---------- branded HTML email shell ----------
// Single template every email body composes into. Mirrors the cream + olive +
// terracotta brand from the site (see app/r/[shareId]/page.tsx and the
// BookingPicker). System sans for body, Georgia for the wordmark — both
// reliable across mail clients.

const BRAND = {
  bgPage: "#F8F2E6",
  bgCard: "#FBF7EB",
  border: "rgba(162,138,67,0.34)",
  ink: "#1E1A14",
  inkSoft: "#5a5448",
  olive: "#A28A43",
  terracotta: "#C05A3E",
};

function renderBrandedEmail(opts: {
  preheader?: string;
  body: string; // already-built HTML for the middle slot
}): string {
  const preheader = opts.preheader
    ? `<div style="display:none;overflow:hidden;line-height:1px;max-height:0;max-width:0;opacity:0;color:transparent;">${escapeHtml(opts.preheader)}</div>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hours</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgPage};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:${BRAND.ink};">
${preheader}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BRAND.bgPage};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:${BRAND.bgCard};border:1px solid ${BRAND.border};border-radius:10px;">
      <tr><td style="padding:28px 32px 0 32px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${BRAND.olive};letter-spacing:-0.01em;">Hours</div>
        <div style="height:1px;background:${BRAND.border};margin:20px 0 24px 0;"></div>
      </td></tr>
      <tr><td style="padding:0 32px 8px 32px;font-size:15px;line-height:1.55;color:${BRAND.ink};">
${opts.body}
      </td></tr>
      <tr><td style="padding:24px 32px 28px 32px;">
        <div style="height:1px;background:${BRAND.border};margin:0 0 16px 0;"></div>
        <div style="font-size:12px;color:${BRAND.inkSoft};line-height:1.5;">
          Hours — get your time back. <a href="https://gethours.org" style="color:${BRAND.olive};text-decoration:none;">gethours.org</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function brandP(html: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:${BRAND.ink};">${html}</p>`;
}

function brandH(html: string): string {
  return `<h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.25;font-weight:700;color:${BRAND.ink};letter-spacing:-0.005em;">${html}</h1>`;
}

function brandMeta(html: string): string {
  return `<p style="margin:0 0 8px 0;font-size:14px;line-height:1.5;color:${BRAND.inkSoft};">${html}</p>`;
}

function brandSignoff(html: string): string {
  return `<p style="margin:24px 0 0 0;font-size:14px;color:${BRAND.inkSoft};">${html}</p>`;
}

function brandButton(href: string, label: string): string {
  return `<p style="margin:0 0 16px 0;"><a href="${href}" style="display:inline-block;background:${BRAND.terracotta};color:${BRAND.bgPage};text-decoration:none;padding:12px 24px;border-radius:9999px;font-weight:600;font-size:14px;letter-spacing:0.01em;">${escapeHtml(label)}</a></p>`;
}

function brandLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${BRAND.olive};text-decoration:underline;">${escapeHtml(label)}</a>`;
}

export async function sendAssessResumeLink(args: {
  to: string;
  clientName: string;
  token: string;
}): Promise<void> {
  const { to, clientName, token } = args;
  const greetingName = clientName.trim() || "there";
  const resumeUrl = `https://gethours.org/assess?token=${encodeURIComponent(token)}`;
  const subject = "Your Hours assessment — pick up where you left off";
  const text = [
    `Hi ${greetingName},`,
    "",
    "Your free Hours assessment is underway. If you step away, this link brings you back to where you left off:",
    "",
    resumeUrl,
    "",
    "The link works for 7 days.",
    "",
    "— The Hours team",
  ].join("\n");
  const html = renderBrandedEmail({
    preheader: "Your resume link — valid for 7 days.",
    body: [
      brandH("Pick up where you left off."),
      brandP(`Hi ${escapeHtml(greetingName)} — your free Hours assessment is underway.`),
      brandP("If you step away, this button brings you back to your saved answers."),
      brandButton(resumeUrl, "Resume my assessment"),
      brandMeta("The link works for 7 days."),
      brandSignoff("— The Hours team"),
    ].join("\n"),
  });
  try {
    await sendViaResend({ from: fromAddress(), to, subject, text, html });
  } catch (err) {
    console.error("[email] sendAssessResumeLink failed:", err);
  }
}

export async function sendFreeReportDelivery(args: {
  to: string;
  clientName: string;
  shareId: string;
  workflowLabel: string;
}): Promise<void> {
  const { to, clientName, shareId, workflowLabel } = args;
  const greetingName = clientName.trim() || "there";
  const reportUrl = `https://gethours.org/r/${shareId}`;
  const subject = "Your free Hours assessment is ready";
  const text = [
    `Hi ${greetingName},`,
    "",
    `Your free assessment of ${workflowLabel} is ready: ${reportUrl}`,
    "",
    "One page: the friction, what it costs as an honest range, and one recommendation you can act on this week.",
    "",
    "Want the whole operation mapped — all six workflows, up to three priority changes, and a 30-minute strategy call? The Full Assessment is $497 and starts from the link at the bottom of your report.",
    "",
    "— The Hours team",
  ].join("\n");
  const html = renderBrandedEmail({
    preheader: "One page. One priority. Ready now.",
    body: [
      brandH("Your free assessment is ready."),
      brandP(`Hi ${escapeHtml(greetingName)},`),
      brandP(
        `Your free assessment of <strong>${escapeHtml(workflowLabel)}</strong> is ready — one page: the friction, what it costs as an honest range, and one recommendation you can act on this week.`,
      ),
      brandButton(reportUrl, "Open your assessment"),
      brandP(
        "Want the whole operation mapped — all six workflows, up to three priority changes, and a 30-minute strategy call? The Full Assessment is $497 and starts from your report.",
      ),
      brandSignoff("— The Hours team"),
    ].join("\n"),
  });
  try {
    await sendViaResend({ from: fromAddress(), to, subject, text, html });
  } catch (err) {
    console.error("[email] sendFreeReportDelivery failed:", err);
  }
}

export async function sendCallConfirmation(args: {
  to: string;
  clientName: string;
  estimatedMinutes?: number;
}): Promise<void> {
  const { to, clientName } = args;
  const greetingName = clientName.trim() || "there";
  const subject = "Your Hours assessment — report on the way";
  const text = [
    `Hi ${greetingName},`,
    "",
    "Thanks for taking the call with Sam.",
    "",
    "Your written assessment is being prepared. We will email it to this address as soon as it is ready — within 1 hour for the free assessment.",
    "",
    "If you need to reach us in the meantime, reply to this email.",
    "",
    "— The Hours team",
  ].join("\n");
  const html = renderBrandedEmail({
    preheader: "Your assessment is being prepared.",
    body: [
      brandH("Thanks for the call."),
      brandP(`Hi ${escapeHtml(greetingName)} — thanks for taking the call with Sam.`),
      brandP(
        "Your written assessment is being prepared. We will email it to this address as soon as it is ready — within 1 hour for the free assessment.",
      ),
      brandP("If you need to reach us in the meantime, reply to this email."),
      brandSignoff("— The Hours team"),
    ].join("\n"),
  });
  try {
    await sendViaResend({
      from: fromAddress(),
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] sendCallConfirmation failed:", err);
  }
}

export async function sendAdminNotification(args: {
  businessName: string;
  assessmentId: string;
  shareId: string;
}): Promise<void> {
  const { businessName, assessmentId, shareId } = args;
  const adminTo = process.env.RESEND_ADMIN_EMAIL;
  if (!adminTo) {
    console.warn("[email] RESEND_ADMIN_EMAIL not set; skipping admin notification");
    return;
  }
  const displayBusiness = businessName?.trim() || "Unknown business";
  const adminLink = `https://gethours.org/admin/r/${assessmentId}`;
  const subject = `[Hours] New assessment: ${displayBusiness}`;
  const text = [
    `New Hours assessment in.`,
    "",
    `Business: ${displayBusiness}`,
    `Assessment ID: ${assessmentId}`,
    `Share ID: ${shareId}`,
    "",
    `Admin view: ${adminLink}`,
  ].join("\n");
  const html = renderBrandedEmail({
    preheader: `New assessment: ${displayBusiness}`,
    body: [
      brandH("New assessment in."),
      brandMeta(`<strong>Business:</strong> ${escapeHtml(displayBusiness)}`),
      brandMeta(
        `<strong>Assessment ID:</strong> <code style="font-family:Menlo,Consolas,monospace;font-size:13px;">${escapeHtml(assessmentId)}</code>`,
      ),
      brandMeta(
        `<strong>Share ID:</strong> <code style="font-family:Menlo,Consolas,monospace;font-size:13px;">${escapeHtml(shareId)}</code>`,
      ),
      `<div style="margin-top:20px;">${brandButton(adminLink, "Open in admin")}</div>`,
    ].join("\n"),
  });
  try {
    await sendViaResend({
      from: fromAddress(),
      to: adminTo,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] sendAdminNotification failed:", err);
  }
}

export async function sendReportReady(args: {
  to: string;
  clientName: string;
  shareId: string;
}): Promise<void> {
  const { to, clientName, shareId } = args;
  const greetingName = clientName.trim() || "there";
  const reportUrl = `https://gethours.org/r/${shareId}`;
  const subject = "Your Hours report is ready";
  const text = [
    `Hi ${greetingName},`,
    "",
    `Your Hours report is ready: ${reportUrl}`,
    "",
    "It walks through where time is going in your business, the highest-impact tools to fix it, and a 4-day plan to get going.",
    "",
    "There's a link at the bottom of the report to book a free 60-minute walkthrough where we go through it together and answer your questions.",
    "",
    "— The Hours team",
  ].join("\n");
  const html = renderBrandedEmail({
    preheader: "Your Hours report is ready.",
    body: [
      brandH("Your report is ready."),
      brandP(`Hi ${escapeHtml(greetingName)},`),
      brandP(
        "It walks through where time is going in your business, the highest-impact tools to fix it, and a 4-day plan to get going.",
      ),
      brandButton(reportUrl, "Open your report"),
      brandP(
        "There's a link at the bottom of the report to book a free 60-minute walkthrough where we go through it together and answer your questions.",
      ),
      brandSignoff("— The Hours team"),
    ].join("\n"),
  });
  try {
    await sendViaResend({
      from: fromAddress(),
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] sendReportReady failed:", err);
    throw err;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Format a JS Date as ICS UTC stamp: YYYYMMDDTHHMMSSZ.
function icsStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function icsEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildBookingIcs(args: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
  organizerEmail: string;
  attendeeEmail: string;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GetHours//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${args.uid}@gethours.org`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(args.start)}`,
    `DTEND:${icsStamp(args.end)}`,
    `SUMMARY:${icsEscape(args.summary)}`,
    `DESCRIPTION:${icsEscape(args.description)}`,
    `ORGANIZER;CN=Hours:mailto:${args.organizerEmail}`,
    `ATTENDEE;CN=${args.attendeeEmail};RSVP=TRUE:mailto:${args.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export async function sendBookingConfirmation(args: {
  to: string;
  clientName: string;
  start: Date;
  end: Date;
  slotId: string;
  joinUrl?: string;
  notes?: string;
}): Promise<void> {
  const greetingName = args.clientName.trim() || "there";
  const startSydney = formatSydneyForEmail(args.start);
  const endSydneyTime = formatSydneyTimeForEmail(args.end);
  const subject = `Your Hours walkthrough — ${startSydney}`;

  const ics = buildBookingIcs({
    uid: args.slotId,
    start: args.start,
    end: args.end,
    summary: "Hours implementation walkthrough + Q&A",
    description: args.joinUrl
      ? `Join: ${args.joinUrl}\n\nAny questions? Reply to this email.`
      : "Tay will be in touch with the joining details before the call.\n\nAny questions? Reply to this email.",
    organizerEmail: process.env.RESEND_FROM_EMAIL ?? "tay@life-time.co",
    attendeeEmail: args.to,
  });

  const text = [
    `Hi ${greetingName},`,
    "",
    `You're booked in for your free 60-minute implementation walkthrough + Q&A.`,
    "",
    `When: ${startSydney} – ${endSydneyTime} (Sydney time)`,
    args.joinUrl ? `Join: ${args.joinUrl}` : "Tay will email you the joining details before the call.",
    args.notes ? `\nYour note: ${args.notes}` : "",
    "",
    "A calendar invite is attached.",
    "",
    "If you need to reschedule, just reply to this email.",
    "",
    "— The Hours team",
  ].filter(Boolean).join("\n");

  const html = renderBrandedEmail({
    preheader: `Walkthrough booked: ${startSydney}`,
    body: [
      brandH("You're booked."),
      brandP(`Hi ${escapeHtml(greetingName)},`),
      brandP(
        "You're booked in for your free 60-minute implementation walkthrough + Q&amp;A.",
      ),
      brandMeta(
        `<strong>When:</strong> ${escapeHtml(startSydney)} – ${escapeHtml(endSydneyTime)} (Sydney time)`,
      ),
      args.joinUrl
        ? brandMeta(
            `<strong>Join:</strong> ${brandLink(args.joinUrl, args.joinUrl)}`,
          )
        : brandP("Tay will email you the joining details before the call."),
      args.notes
        ? brandMeta(`<strong>Your note:</strong> ${escapeHtml(args.notes)}`)
        : "",
      brandP("A calendar invite is attached."),
      brandP("If you need to reschedule, just reply to this email."),
      brandSignoff("— The Hours team"),
    ]
      .filter(Boolean)
      .join("\n"),
  });

  try {
    await sendViaResend({
      from: fromAddress(),
      to: args.to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: "walkthrough.ics",
          content: Buffer.from(ics, "utf8").toString("base64"),
          content_type: "text/calendar; charset=utf-8; method=REQUEST",
        },
      ],
    });
  } catch (err) {
    console.error("[email] sendBookingConfirmation failed:", err);
  }
}

export async function sendBookingAdminNotification(args: {
  businessName: string;
  clientName: string;
  clientEmail: string;
  start: Date;
  end: Date;
  assessmentId: string;
  shareId: string;
  notes?: string;
}): Promise<void> {
  const adminTo = process.env.RESEND_ADMIN_EMAIL;
  if (!adminTo) {
    console.warn("[email] RESEND_ADMIN_EMAIL not set; skipping booking admin notification");
    return;
  }
  const displayBusiness = args.businessName?.trim() || "Unknown business";
  const startSydney = formatSydneyForEmail(args.start);
  const endSydneyTime = formatSydneyTimeForEmail(args.end);
  const reportLink = `https://gethours.org/r/${args.shareId}`;
  const adminLink = `https://gethours.org/admin/r/${args.assessmentId}`;
  const subject = `[Hours] Walkthrough booked: ${displayBusiness} — ${startSydney}`;

  const text = [
    `New walkthrough booking.`,
    "",
    `Business: ${displayBusiness}`,
    `Client: ${args.clientName} <${args.clientEmail}>`,
    `When: ${startSydney} – ${endSydneyTime} (Sydney)`,
    args.notes ? `Notes: ${args.notes}` : "",
    "",
    `Report: ${reportLink}`,
    `Admin: ${adminLink}`,
  ].filter(Boolean).join("\n");

  const html = renderBrandedEmail({
    preheader: `${displayBusiness} booked a walkthrough — ${startSydney}`,
    body: [
      brandH("New walkthrough booking."),
      brandMeta(`<strong>Business:</strong> ${escapeHtml(displayBusiness)}`),
      brandMeta(
        `<strong>Client:</strong> ${escapeHtml(args.clientName)} &lt;${escapeHtml(args.clientEmail)}&gt;`,
      ),
      brandMeta(
        `<strong>When:</strong> ${escapeHtml(startSydney)} – ${escapeHtml(endSydneyTime)} (Sydney)`,
      ),
      args.notes
        ? brandMeta(`<strong>Notes:</strong> ${escapeHtml(args.notes)}`)
        : "",
      `<div style="margin-top:20px;">${brandButton(adminLink, "Open in admin")}</div>`,
      brandMeta(brandLink(reportLink, "Open report")),
    ]
      .filter(Boolean)
      .join("\n"),
  });

  try {
    await sendViaResend({
      from: fromAddress(),
      to: adminTo,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] sendBookingAdminNotification failed:", err);
  }
}

export async function sendBookingCancellation(args: {
  to: string;
  clientName: string;
  start: Date;
}): Promise<void> {
  const greetingName = args.clientName.trim() || "there";
  const startSydney = formatSydneyForEmail(args.start);
  const subject = `Your Hours walkthrough — cancelled`;
  const text = [
    `Hi ${greetingName},`,
    "",
    `Your walkthrough on ${startSydney} (Sydney time) has been cancelled.`,
    "",
    `If this was a mistake or you'd like to rebook, reply to this email and we'll sort it out.`,
    "",
    "— The Hours team",
  ].join("\n");
  const html = renderBrandedEmail({
    preheader: `Walkthrough on ${startSydney} — cancelled`,
    body: [
      brandH("Walkthrough cancelled."),
      brandP(`Hi ${escapeHtml(greetingName)},`),
      brandP(
        `Your walkthrough on <strong>${escapeHtml(startSydney)}</strong> (Sydney time) has been cancelled.`,
      ),
      brandP(
        "If this was a mistake or you'd like to rebook, reply to this email and we'll sort it out.",
      ),
      brandSignoff("— The Hours team"),
    ].join("\n"),
  });
  try {
    await sendViaResend({
      from: fromAddress(),
      to: args.to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] sendBookingCancellation failed:", err);
  }
}

function formatSydneyForEmail(d: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function formatSydneyTimeForEmail(d: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
