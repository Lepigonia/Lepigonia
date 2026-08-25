import { NextResponse } from "next/server";
import { getGithubFile, putGithubFile, isAdmin } from "../../../../lib/admin";

const fallback = { en: { eyebrow: "Behind the journal", title: "A real person. A life in motion.", paragraphs: ["", "", ""] }, de: { eyebrow: "Hinter dem Journal", title: "Ein echter Mensch. Ein Leben unterwegs.", paragraphs: ["", "", ""] } };
async function read() { try { const f = await getGithubFile("data/about.json"); return { data: JSON.parse(Buffer.from(f.content, "base64").toString("utf8")), sha: f.sha }; } catch { return { data: fallback, sha: null }; } }
export async function GET(request) { if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 }); return NextResponse.json((await read()).data); }
export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try { const { data, sha } = await read(); const body = await request.json(); if (!body.en || !body.de) return NextResponse.json({ error: "Beide Sprachversionen werden benötigt." }, { status: 400 }); const clean = (v) => ({ eyebrow: String(v.eyebrow || "").trim(), title: String(v.title || "").trim(), paragraphs: Array.isArray(v.paragraphs) ? v.paragraphs.slice(0, 3).map(x => String(x || "").trim()) : [] }); const next = { en: clean(body.en), de: clean(body.de) }; await putGithubFile("data/about.json", JSON.stringify(next, null, 2) + "\n", "Update About page", sha); return NextResponse.json({ ok: true }); } catch (e) { return NextResponse.json({ error: e.message || "About konnte nicht gespeichert werden." }, { status: 500 }); }
}
