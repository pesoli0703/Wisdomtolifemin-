import "server-only";

/**
 * Minimal Resend client (no SDK dependency). Credentials live only in
 * server-side environment variables — never exposed to the browser.
 *
 * Set:
 *   RESEND_API_KEY   — from https://resend.com
 *   EMAIL_FROM       — e.g. "Wisdom To Life Ministry <noreply@yourdomain.com>"
 *                      (must be a verified sender/domain on Resend)
 *   MINISTRY_EMAIL   — recipient, defaults to Wisdomtolifemin@gmail.com
 */

const RESEND_URL = "https://api.resend.com/emails";

export const MINISTRY_EMAIL =
  process.env.MINISTRY_EMAIL || "Wisdomtolifemin@gmail.com";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  text?: string;
}

export async function sendEmail(
  input: SendEmailInput
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY not configured — email skipped. Submission is still stored in the database."
    );
    return { ok: false, error: "email-not-configured" };
  }

  const from =
    process.env.EMAIL_FROM || "Wisdom To Life Ministry <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error:", res.status, body);
      return { ok: false, error: `resend-${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false, error: "network" };
  }
}

/** Shared HTML shell so ministry emails look consistent. */
export function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4ecd8;font-family:Georgia,serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4ecd8;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ebdcbc;">
          <tr><td style="background:#081a33;padding:24px 32px;">
            <p style="margin:0;color:#c9a227;font-size:18px;letter-spacing:1px;">WISDOM TO LIFE MINISTRY</p>
            <p style="margin:4px 0 0;color:#bcd0e6;font-size:13px;">${title}</p>
          </td></tr>
          <tr><td style="padding:32px;color:#0c2140;font-size:14px;line-height:1.7;">
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:16px 32px;background:#faf6ec;color:#5b87ba;font-size:12px;">
            Wisdomtolifemin@gmail.com
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
