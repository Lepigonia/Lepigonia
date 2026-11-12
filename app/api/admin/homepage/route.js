import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { isAdmin, getGithubFile, putGithubFile } from "../../../../lib/admin";
import { ensureDatabase, sql } from "../../../../lib/db";
import { getHomepageSettings } from "../../../../lib/homepage";
import { getPosts } from "../../../../lib/posts";
export const dynamic = "force-dynamic";
const SETTINGS_PATH = "homepage.json";
async function removeUnusedBlob(url) {
  if (!url) return false;
  await ensureDatabase();
  const db = sql();
  const gallery = await db`SELECT id FROM gallery_images WHERE url=${url} LIMIT 1`;
  const posts = getPosts().some((post) => post.image === url || String(post.content || "").includes(url));
  if (gallery.length || posts) return false;
  await del(url);
  return true;
}
async function writeSettings(next, message) {
  let sha;
  try { sha = (await getGithubFile(SETTINGS_PATH)).sha; }
  catch (error) { if (!String(error.message || "").toLowerCase().includes("not found")) throw error; }
  await putGithubFile(SETTINGS_PATH, JSON.stringify(next, null, 2) + "\n", message, sha);
}
export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try { return NextResponse.json(getHomepageSettings()); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const body = await request.json();
    const old = getHomepageSettings();
    const clean = (key, max = 500) => String(body[key] ?? old[key] ?? "").trim().slice(0, max);
    const next = {
      image: clean("image", 2000), imageAlt: clean("imageAlt", 240),
      eyebrowEn: clean("eyebrowEn"), eyebrowDe: clean("eyebrowDe"),
      titleEn: clean("titleEn"), titleDe: clean("titleDe"),
      copyEn: clean("copyEn", 1000), copyDe: clean("copyDe", 1000),
      buttonEn: clean("buttonEn", 120), buttonDe: clean("buttonDe", 120)
    };
    if (next.image && !next.image.startsWith("https://")) return NextResponse.json({ error: "Ungültige Bildadresse." }, { status: 400 });
    await writeSettings(next, "Update homepage content");
    if (old.image && old.image !== next.image) {
      try { await removeUnusedBlob(old.image); } catch (e) { console.warn("Old homepage image cleanup skipped:", e); }
    }
    return NextResponse.json({ ok: true, settings: next, deploymentTriggered: true });
  } catch (e) { return NextResponse.json({ error: e.message || "Speichern fehlgeschlagen." }, { status: 500 }); }
}
export async function DELETE(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const old = getHomepageSettings();
    const next = { ...old, image: "" };
    await writeSettings(next, "Remove homepage image");
    let blobDeleted = false;
    if (old.image) {
      try { blobDeleted = await removeUnusedBlob(old.image); } catch (e) { console.warn("Homepage image cleanup skipped:", e); }
    }
    return NextResponse.json({ ok: true, blobDeleted, deploymentTriggered: true });
  } catch (e) { return NextResponse.json({ error: e.message || "Löschen fehlgeschlagen." }, { status: 500 }); }
}
