import { NextResponse } from "next/server";
import { ensureDatabase, sql } from "../../../../lib/db";
import { hashToken } from "../../../../lib/newsletter";

export const dynamic = "force-dynamic";

const back = (request, status) => NextResponse.redirect(new URL(`/newsletter/confirm?status=${status}`, request.url), 303);

// Called by the button on /newsletter/confirm (POST), not by the e-mail link itself: mail scanners that
// pre-fetch links must not be able to confirm a subscription on behalf of a person.
export async function POST(request) {
  try {
    const form = await request.formData();
    const token = String(form.get("token") || "");
    if (token.length < 20 || token.length > 200) return back(request, "invalid");
    await ensureDatabase();
    const db = sql();
    const rows = await db`UPDATE newsletter_subscribers
      SET confirmed_at=NOW(), confirm_token_hash=NULL, unsubscribed_at=NULL
      WHERE confirm_token_hash=${hashToken(token)} AND confirmed_at IS NULL AND confirm_sent_at > NOW() - INTERVAL '48 hours'
      RETURNING id`;
    return back(request, rows.length ? "ok" : "invalid");
  } catch (error) {
    console.error("Newsletter confirmation failed:", error?.message || error);
    return back(request, "error");
  }
}