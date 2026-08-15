import { NextResponse } from "next/server";
import { getGithubFile, putGithubBinary, isAdmin } from "../../../../lib/admin";
export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const { data } = await request.json();
    if (!data?.startsWith("data:image/")) return NextResponse.json({ error: "Bitte ein Bild auswählen." }, { status: 400 });
    let sha; try { sha = (await getGithubFile("public/uploads/car.jpg")).sha; } catch {}
    await putGithubBinary("public/uploads/car.jpg", data, "Update vehicle image", sha);
    return NextResponse.json({ ok: true, url: "/uploads/car.jpg" });
  } catch (error) { return NextResponse.json({ error: error.message || "Upload fehlgeschlagen." }, { status: 500 }); }
}
