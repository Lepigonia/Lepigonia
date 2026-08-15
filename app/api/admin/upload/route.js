import { NextResponse } from "next/server";
import { getGithubFile, putGithubBinary, isAdmin } from "../../../../lib/admin";

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const { filename, data } = await request.json();
    if (!filename || !data || !data.startsWith("data:image/")) return NextResponse.json({ error: "Bitte eine Bilddatei auswählen." }, { status: 400 });
    const ext = (filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return NextResponse.json({ error: "Nicht unterstütztes Bildformat." }, { status: 400 });
    if (data.length > 12 * 1024 * 1024) return NextResponse.json({ error: "Das Bild ist zu groß (max. 9 MB)." }, { status: 400 });
    const safe = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const path = `public/uploads/${safe}`;
    await putGithubBinary(path, data, `Upload image: ${safe}`);
    return NextResponse.json({ ok: true, url: `/uploads/${safe}` });
  } catch (error) { return NextResponse.json({ error: error.message || "Upload fehlgeschlagen." }, { status: 500 }); }
}
