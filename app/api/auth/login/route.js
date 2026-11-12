import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { checkAdminLoginRateLimit, setAuthCookie } from "../../../../lib/admin";

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(request) {
  try {
    const allowed = await checkAdminLoginRateLimit(request);
    if (!allowed) return NextResponse.json(
      { error: "Zu viele Anmeldeversuche. Bitte warte 15 Minuten und versuche es erneut." },
      { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store" } },
    );

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const expectedEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!expectedEmail || !process.env.ADMIN_PASSWORD || !email || !password ||
        !safeEqual(email, expectedEmail) || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
      return NextResponse.json({ error: "Ungültige Zugangsdaten." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const response = NextResponse.json({ ok: true, role: "admin", redirect: "/admin" }, { headers: { "Cache-Control": "no-store" } });
    setAuthCookie(response, expectedEmail, "admin");
    return response;
  } catch {
    return NextResponse.json({ error: "Anmeldung derzeit nicht verfügbar." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
