import { NextResponse } from "next/server";
import { verifyAdmin } from "../../../../lib/admin";
import { ensureDatabase, sql } from "../../../../lib/db";
import { unsubscribeUrl } from "../../../../lib/newsletter";

export const dynamic = "force-dynamic";

// Spreadsheet programs execute cells that start with = + - @ as formulas, so those get a leading apostrophe.
function csvCell(value) {
  let text = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    await ensureDatabase();
    const db = sql();
    const rows = await db`SELECT id, email, source, consent_version, consent_text, consented_at, confirmed_at, created_at FROM newsletter_subscribers WHERE unsubscribed_at IS NULL ORDER BY created_at DESC`;
    if (new URL(request.url).searchParams.get("format") === "csv") {
      // Only confirmed (double opt-in) addresses may be mailed, so only those are exported.
      const confirmed = rows.filter((row) => row.confirmed_at);
      const lines = [
        ["E-Mail", "Anmeldedatum", "Bestätigt am", "Quelle", "Einwilligungsversion", "Abmelde-Link"],
        ...confirmed.map((row) => [row.email, row.consented_at, row.confirmed_at, row.source, row.consent_version, unsubscribeUrl(row.id)]),
      ];
      const csv = "\uFEFF" + lines.map((line) => line.map(csvCell).join(";")).join("\r\n");
      return new Response(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": 'attachment; filename="lepigonia-newsletter.csv"',
          "cache-control": "no-store",
        },
      });
    }
    return NextResponse.json({
      subscribers: rows.map((row) => ({
        id: row.id,
        email: row.email,
        source: row.source,
        status: row.confirmed_at ? "confirmed" : "pending",
        consentVersion: row.consent_version,
        consentText: row.consent_text,
        consentedAt: row.consented_at,
        confirmedAt: row.confirmed_at,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Newsletter-Liste konnte nicht geladen werden." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Eintrag fehlt." }, { status: 400 });
    await ensureDatabase();
    const db = sql();
    const deleted = await db`DELETE FROM newsletter_subscribers WHERE id=${String(body.id)} RETURNING id`;
    if (!deleted.length) return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Eintrag konnte nicht gelöscht werden." }, { status: 500 });
  }
}