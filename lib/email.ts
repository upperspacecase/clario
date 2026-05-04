const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface ResendPayload {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
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
    "Thanks for taking the call with Iris.",
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
      <p style="margin:0 0 16px 0;">Thanks for taking the call with Iris.</p>
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
