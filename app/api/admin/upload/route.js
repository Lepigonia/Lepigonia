import { NextResponse } from "next/server";
import { putGithubBinary, isAdmin } from "../../../../lib/admin";

const MAX_BYTES = 1800 * 1024;

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const { filename, data } = await request.json();
    if (!filename || !data || !data.startsWith("data:image/")) return NextResponse.json({ error: "Bitte eine Bilddatei auswählen." }, { status: 400 });
    const match = data.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!match) return NextResponse.json({ error: "Ungültige Bilddaten." }, { status: 400 });
    const mime = match[1].toLowerCase();
    const base64 = match[2];
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime)) return NextResponse.json({ error: "Nicht unterstütztes Bildformat." }, { status: 400 });
    const bytes = Math.floor(base64.length * 3 / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    if (bytes > MAX_BYTES) return NextResponse.json({ error: "Das Bild ist noch zu groß. Es muss maximal 1.8 MB groß sein." }, { status: 400 });
    const safe = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const path = `public/uploads/${safe}`;
    await putGithubBinary(path, data, `Upload image: ${safe}`);
    const url = `/uploads/${safe}`;
    return NextResponse.json({ ok: true, url, filename: safe });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Upload fehlgeschlagen." }, { status: 500 });
  }
}
