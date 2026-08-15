import { NextResponse } from "next/server";
import { setAdminCookie } from "../../../../../lib/admin";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password || email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Ungültige Zugangsdaten." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    setAdminCookie(response, email);
    return response;
  } catch { return NextResponse.json({ error: "Anmeldung fehlgeschlagen." }, { status: 400 }); }
}
