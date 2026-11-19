import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ensureDatabase, sql } from "../../../lib/db";
import { checkNewsletterSignupRateLimit } from "../../../lib/admin";
import { isMailConfigured, sendMail } from "../../../lib/mail";
import { CONSENT_TEXT, CONSENT_VERSION, confirmationMail, createToken, hashToken } from "../../../lib/newsletter";

export const dynamic = "force-dynamic";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const noStore = { "Cache-Control": "no-store" };

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true });
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !emailPattern.test(email)) {
      return NextResponse.json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 });
    }
    if (body.consent !== true) {
      return NextResponse.json({ error: "Bitte bestätige zuerst die Newsletter-Einwilligung." }, { status: 400 });
    }
    if (!(await checkNewsletterSignupRateLimit(request))) {
      return NextResponse.json({ error: "Zu viele Anmeldeversuche. Bitte versuche es später erneut." }, { status: 429, headers: { "Retry-After": "3600", ...noStore } });
    }
    // Double opt-in needs a working mail setup. Without it nothing is stored: unconfirmable addresses are useless.
    if (!isMailConfigured()) {
      console.error("Newsletter signup rejected: RESEND_API_KEY / NEWSLETTER_FROM are not configured.");
      return NextResponse.json({ error: "Die Newsletter-Anmeldung ist derzeit nicht verfügbar. Bitte versuche es später erneut." }, { status: 503, headers: noStore });
    }

    const source = body.source === "newsletter-link" ? "newsletter-link" : "popup";
    await ensureDatabase();
    const db = sql();

    // Unconfirmed signups are removed after 7 days (rows from before double opt-in have no confirm_sent_at and are kept).
    await db`DELETE FROM newsletter_subscribers WHERE confirmed_at IS NULL AND confirm_sent_at IS NOT NULL AND confirm_sent_at < NOW() - INTERVAL '7 days'`;

    const token = createToken();
    // New address, a previously unsubscribed one, or an unconfirmed one whose last mail is older than 10 minutes
    // gets a fresh confirmation token. An already confirmed address is left untouched (and no mail is sent).
    const rows = await db`INSERT INTO newsletter_subscribers (id, email, source, consent_version, consent_text, consented_at, created_at, unsubscribed_at, confirmed_at, confirm_token_hash, confirm_sent_at)
      VALUES (${crypto.randomUUID()}, ${email}, ${source}, ${CONSENT_VERSION}, ${CONSENT_TEXT}, NOW(), NOW(), NULL, NULL, ${hashToken(token)}, NOW())
      ON CONFLICT (email) DO UPDATE SET
        source=EXCLUDED.source,
        consent_version=EXCLUDED.consent_version,
        consent_text=EXCLUDED.consent_text,
        consented_at=NOW(),
        unsubscribed_at=NULL,
        confirmed_at=NULL,
        confirm_token_hash=EXCLUDED.confirm_token_hash,
        confirm_sent_at=NOW()
      WHERE newsletter_subscribers.unsubscribed_at IS NOT NULL
        OR (newsletter_subscribers.confirmed_at IS NULL AND (newsletter_subscribers.confirm_sent_at IS NULL OR newsletter_subscribers.confirm_sent_at < NOW() - INTERVAL '10 minutes'))
      RETURNING id, (xmax = 0) AS inserted`;

    if (rows.length) {
      try {
        await sendMail({ to: email, ...confirmationMail(token) });
      } catch (error) {
        console.error("Newsletter confirmation mail failed:", error?.message || error);
        // Do not keep an address we could not even ask for confirmation.
        if (rows[0].inserted) await db`DELETE FROM newsletter_subscribers WHERE id=${rows[0].id}`;
        else await db`UPDATE newsletter_subscribers SET confirm_sent_at=NULL WHERE id=${rows[0].id}`;
        return NextResponse.json({ error: "Die Bestätigungs-E-Mail konnte gerade nicht gesendet werden. Bitte versuche es später erneut." }, { status: 502, headers: noStore });
      }
    }
    // Same answer whether or not a mail was sent, so the form cannot be used to probe for subscribers.
    return NextResponse.json({ ok: true, confirmationRequired: true }, { headers: noStore });
  } catch (error) {
    console.error("Newsletter signup failed:", error?.message || error);
    return NextResponse.json({ error: "Die Anmeldung konnte gerade nicht gespeichert werden. Bitte versuche es später erneut." }, { status: 500 });
  }
}