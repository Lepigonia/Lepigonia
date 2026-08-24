import { NextResponse } from "next/server";
import { getGithubFile, putGithubBinary, isAdmin } from "../../../../lib/admin";

const MAX_BYTES = 850 * 1024;

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const { data } = await request.json();
    if (!data?.startsWith("data:image/")) return NextResponse.json({ error: "Bitte ein Bild auswählen." }, { status: 400 });
    const match = data.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!match) return NextResponse.json({ error: "Ungültige Bilddaten." }, { status: 400 });
    const base64 = match[2];
    const bytes = Math.floor(base64.length * 3 / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    if (bytes > MAX_BYTES) return NextResponse.json({ error: "Das Fahrzeugbild ist noch zu groß. Es muss maximal 850 KB groß sein." }, { status: 400 });
    let sha; try { sha = (await getGithubFile("public/uploads/car.jpg")).sha; } catch {}
    await putGithubBinary("public/uploads/car.jpg", data, "Update vehicle image", sha);
    return NextResponse.json({ ok: true, url: "/uploads/car.jpg" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Fahrzeugbild-Upload fehlgeschlagen." }, { status: 500 });
  }
}
