import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ensureDatabase, sql } from "../../../lib/db";
import { checkNewsletterSignupRateLimit } from "../../../lib/admin";

export const dynamic = "force-dynamic";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONSENT_VERSION = "newsletter-consent-2026-11";
const CONSENT_TEXT = "Ich möchte den Lepigonia-Newsletter mit Reisegeschichten und Neuigkeiten per E-Mail erhalten. Meine E-Mail-Adresse und der Zeitpunkt meiner Einwilligung werden dafür gespeichert. Ich kann meine Einwilligung jederzeit widerrufen.";

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
      return NextResponse.json({ error: "Zu viele Anmeldeversuche. Bitte versuche es später erneut." }, { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
    }

    const source = body.source === "newsletter-link" ? "newsletter-link" : "popup";
    await ensureDatabase();
    const db = sql();
    await db`INSERT INTO newsletter_subscribers (id, email, source, consent_version, consent_text, consented_at, created_at, unsubscribed_at)
      VALUES (${crypto.randomUUID()}, ${email}, ${source}, ${CONSENT_VERSION}, ${CONSENT_TEXT}, NOW(), NOW(), NULL)
      ON CONFLICT (email) DO UPDATE SET
        source=EXCLUDED.source,
        consent_version=EXCLUDED.consent_version,
        consent_text=EXCLUDED.consent_text,
        consented_at=NOW(),
        unsubscribed_at=NULL
      WHERE newsletter_subscribers.unsubscribed_at IS NOT NULL`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter signup failed:", error?.message || error);
    return NextResponse.json({ error: "Die Anmeldung konnte gerade nicht gespeichert werden. Bitte versuche es später erneut." }, { status: 500 });
  }
}
