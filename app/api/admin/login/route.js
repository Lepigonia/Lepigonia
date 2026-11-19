import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { checkAdminLoginRateLimit, createSession, getAdminEmail, setSessionCookie } from "../../../../lib/admin";
import { isTotpEnabled, verifyTotp } from "../../../../lib/totp";

const noStore = { "Cache-Control": "no-store" };

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
      { status: 429, headers: { "Retry-After": "900", ...noStore } },
    );

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const expectedEmail = getAdminEmail();
    const expectedPassword = process.env.ADMIN_PASSWORD || "";

    // Evaluate every factor before deciding, and answer with one generic message.
    const emailOk = Boolean(expectedEmail && email) && safeEqual(email, expectedEmail);
    const passwordOk = Boolean(expectedPassword && password) && safeEqual(password, expectedPassword);
    const totpOk = !isTotpEnabled() || verifyTotp(body.totp, process.env.ADMIN_TOTP_SECRET);
    if (!emailOk || !passwordOk || !totpOk) {
      return NextResponse.json({ error: "Ungültige Zugangsdaten." }, { status: 401, headers: noStore });
    }

    const token = await createSession();
    const response = NextResponse.json({ ok: true, role: "admin", redirect: "/admin" }, { headers: noStore });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Admin login failed:", error?.message || error);
    return NextResponse.json({ error: "Anmeldung derzeit nicht verfügbar." }, { status: 503, headers: noStore });
  }
}