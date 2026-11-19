// Minimal transactional mail sender (Resend HTTP API, no extra dependency).
// To use another provider, only this file has to change.

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.NEWSLETTER_FROM);
}

export async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured()) throw new Error("Mail delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.NEWSLETTER_FROM, to: [to], subject, text, html }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`Mail provider responded with ${response.status}: ${detail}`);
  }
}