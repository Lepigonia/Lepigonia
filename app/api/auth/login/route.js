import { NextResponse } from "next/server";
import { setAuthCookie } from "../../../../lib/admin";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: "Bitte E-Mail und Passwort eingeben." }, { status: 400 });

    // Phase 1: only the site owner/admin is enabled.
    // Registered users will use the same endpoint once a persistent user store is added.
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const response = NextResponse.json({ ok: true, role: "admin", redirect: "/admin" });
      setAuthCookie(response, email, "admin");
      return response;
    }

    return NextResponse.json({ error: "Ungültige Zugangsdaten." }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen." }, { status: 400 });
  }
}
