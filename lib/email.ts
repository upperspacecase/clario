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
    "Your written report is being prepared. We will email it to this address as soon as it is ready (within 24 hours).",
    "",
    "If you need to reach us in the meantime, reply to this email.",
    "",
    "— The Hours team",
  ].join("\n");
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1E1A14; max-width:560px; margin:0 auto; padding:24px;">
      <p style="margin:0 0 16px 0;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin:0 0 16px 0;">Thanks for taking the call with Sam.</p>
      <p style="margin:0 0 16px 0;">Your written report is being prepared. We will email it to this address as soon as it is ready (within 24 hours).</p>
      <p style="margin:0 0 16px 0;">If you need to reach us in the meantime, reply to this email.</p>
      <p style="margin:24px 0 0 0; color:#5a5448;">— The Hours team</p>
    </div>
  `;
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
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1E1A14; max-width:560px; margin:0 auto; padding:24px;">
      <p style="margin:0 0 16px 0;"><strong>New Hours assessment in.</strong></p>
      <p style="margin:0 0 8px 0;">Business: ${escapeHtml(displayBusiness)}</p>
      <p style="margin:0 0 8px 0;">Assessment ID: <code>${escapeHtml(assessmentId)}</code></p>
      <p style="margin:0 0 16px 0;">Share ID: <code>${escapeHtml(shareId)}</code></p>
      <p style="margin:0 0 16px 0;"><a href="${adminLink}">Open in admin</a></p>
    </div>
  `;
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
    "There's a link at the bottom of the report to book a free 30-minute walkthrough where we go through it together and answer your questions.",
    "",
    "— The Hours team",
  ].join("\n");
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1E1A14; max-width:560px; margin:0 auto; padding:24px;">
      <p style="margin:0 0 16px 0;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin:0 0 16px 0;">Your Hours report is ready: <a href="${reportUrl}">${reportUrl}</a></p>
      <p style="margin:0 0 16px 0;">It walks through where time is going in your business, the highest-impact tools to fix it, and a 4-day plan to get going.</p>
      <p style="margin:0 0 16px 0;">There's a link at the bottom of the report to book a free 30-minute walkthrough where we go through it together and answer your questions.</p>
      <p style="margin:24px 0 0 0; color:#5a5448;">— The Hours team</p>
    </div>
  `;
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
    `You're booked in for your free 30-minute implementation walkthrough + Q&A.`,
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

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1E1A14; max-width:560px; margin:0 auto; padding:24px;">
      <p style="margin:0 0 16px 0;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin:0 0 16px 0;">You're booked in for your free 30-minute implementation walkthrough + Q&amp;A.</p>
      <p style="margin:0 0 8px 0;"><strong>When:</strong> ${escapeHtml(startSydney)} – ${escapeHtml(endSydneyTime)} (Sydney time)</p>
      ${args.joinUrl ? `<p style="margin:0 0 16px 0;"><strong>Join:</strong> <a href="${escapeHtml(args.joinUrl)}">${escapeHtml(args.joinUrl)}</a></p>` : `<p style="margin:0 0 16px 0;">Tay will email you the joining details before the call.</p>`}
      ${args.notes ? `<p style="margin:0 0 16px 0;"><strong>Your note:</strong> ${escapeHtml(args.notes)}</p>` : ""}
      <p style="margin:0 0 16px 0;">A calendar invite is attached.</p>
      <p style="margin:0 0 16px 0;">If you need to reschedule, just reply to this email.</p>
      <p style="margin:24px 0 0 0; color:#5a5448;">— The Hours team</p>
    </div>
  `;

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

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1E1A14; max-width:560px; margin:0 auto; padding:24px;">
      <p style="margin:0 0 16px 0;"><strong>New walkthrough booking.</strong></p>
      <p style="margin:0 0 8px 0;">Business: ${escapeHtml(displayBusiness)}</p>
      <p style="margin:0 0 8px 0;">Client: ${escapeHtml(args.clientName)} &lt;${escapeHtml(args.clientEmail)}&gt;</p>
      <p style="margin:0 0 8px 0;">When: ${escapeHtml(startSydney)} – ${escapeHtml(endSydneyTime)} (Sydney)</p>
      ${args.notes ? `<p style="margin:0 0 16px 0;"><strong>Notes:</strong> ${escapeHtml(args.notes)}</p>` : ""}
      <p style="margin:0 0 8px 0;"><a href="${reportLink}">Open report</a></p>
      <p style="margin:0 0 16px 0;"><a href="${adminLink}">Open in admin</a></p>
    </div>
  `;

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
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1E1A14; max-width:560px; margin:0 auto; padding:24px;">
      <p style="margin:0 0 16px 0;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin:0 0 16px 0;">Your walkthrough on <strong>${escapeHtml(startSydney)}</strong> (Sydney time) has been cancelled.</p>
      <p style="margin:0 0 16px 0;">If this was a mistake or you'd like to rebook, reply to this email and we'll sort it out.</p>
      <p style="margin:24px 0 0 0; color:#5a5448;">— The Hours team</p>
    </div>
  `;
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
