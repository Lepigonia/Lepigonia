import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/admin";
import { ensureDatabase, sql } from "../../../../lib/db";

export const dynamic = "force-dynamic";

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    await ensureDatabase();
    const db = sql();
    const rows = await db`SELECT id, email, source, consent_version, consent_text, consented_at, created_at FROM newsletter_subscribers WHERE unsubscribed_at IS NULL ORDER BY created_at DESC`;
    if (new URL(request.url).searchParams.get("format") === "csv") {
      const lines = [
        ["E-Mail", "Anmeldedatum", "Quelle", "Einwilligungsversion"],
        ...rows.map((row) => [row.email, row.consented_at, row.source, row.consent_version]),
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
        consentVersion: row.consent_version,
        consentText: row.consent_text,
        consentedAt: row.consented_at,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Newsletter-Liste konnte nicht geladen werden." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
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
