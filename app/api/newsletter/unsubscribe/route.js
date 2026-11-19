import { NextResponse } from "next/server";
import { ensureDatabase, sql } from "../../../../lib/db";
import { isValidUnsubscribeToken } from "../../../../lib/newsletter";

export const dynamic = "force-dynamic";

// Accepts the button on /newsletter/unsubscribe (form POST) and RFC 8058 one-click unsubscribe
// (List-Unsubscribe-Post), where mail clients POST to the link from the List-Unsubscribe header.
export async function POST(request) {
  const url = new URL(request.url);
  let id = url.searchParams.get("id") || "";
  let token = url.searchParams.get("t") || "";
  let oneClick = false;
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      id = String(form.get("id") || id);
      token = String(form.get("t") || token);
      oneClick = form.get("List-Unsubscribe") === "One-Click";
    }
  } catch {}

  const reply = (status, code) => oneClick
    ? NextResponse.json({ ok: status === "ok" }, { status: code })
    : NextResponse.redirect(new URL(`/newsletter/unsubscribe?status=${status}`, request.url), 303);

  try {
    if (!id || id.length > 100 || !isValidUnsubscribeToken(id, token)) return reply("invalid", 400);
    await ensureDatabase();
    const db = sql();
    // The address is deleted completely (nothing is kept "for later"). A valid link for an address that is
    // already gone still ends with "unsubscribed", so the link keeps working if clicked twice.
    await db`DELETE FROM newsletter_subscribers WHERE id=${id}`;
    return reply("ok", 200);
  } catch (error) {
    console.error("Newsletter unsubscribe failed:", error?.message || error);
    return reply("error", 500);
  }
}