import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { verifyAdmin, getGithubFile, putGithubFile } from "../../../../lib/admin";
import { ensureDatabase, sql } from "../../../../lib/db";
import { getHomepageSettings, mergeHomepageSettings } from "../../../../lib/homepage";
import { getLivePosts } from "../../../../lib/github-posts";
import { isAllowedImageUrl } from "../../../../lib/media";
export const dynamic = "force-dynamic";
const SETTINGS_PATH = "homepage.json";
const noStore = { "Cache-Control": "no-store" };

// Current settings as stored on GitHub. The deployed homepage.json can be a minute behind after a save.
async function readLiveSettings() {
  try {
    const file = await getGithubFile(SETTINGS_PATH);
    const saved = JSON.parse(Buffer.from(file.content || "", "base64").toString("utf8"));
    return { settings: mergeHomepageSettings(saved), sha: file.sha };
  } catch (error) {
    if (/not found/i.test(error?.message || "")) return { settings: mergeHomepageSettings(null), sha: undefined };
    throw error;
  }
}
// A blob is only removed when neither the gallery nor any post that exists on GitHub right now uses it.
// If GitHub cannot be reached this throws and the callers skip the cleanup.
async function removeUnusedBlob(url) {
  if (!url) return false;
  await ensureDatabase();
  const db = sql();
  const gallery = await db`SELECT id FROM gallery_images WHERE url=${url} LIMIT 1`;
  if (gallery.length) return false;
  const usedByPost = (await getLivePosts()).some((post) => post.image === url || String(post.content || "").includes(url));
  if (usedByPost) return false;
  await del(url);
  return true;
}
async function writeSettings(next, message, sha) {
  await putGithubFile(SETTINGS_PATH, JSON.stringify(next, null, 2) + "\n", message, sha);
}
export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try { return NextResponse.json((await readLiveSettings()).settings, { headers: noStore }); }
  catch (e) {
    console.warn("Live homepage settings unavailable, using deployed file:", e?.message || e);
    return NextResponse.json(getHomepageSettings(), { headers: noStore });
  }
}
export async function POST(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const body = await request.json();
    const { settings: old, sha } = await readLiveSettings();
    const clean = (key, max = 500) => String(body[key] ?? old[key] ?? "").trim().slice(0, max);
    const next = {
      image: clean("image", 2000), imageAlt: clean("imageAlt", 240),
      eyebrowEn: clean("eyebrowEn"), eyebrowDe: clean("eyebrowDe"),
      titleEn: clean("titleEn"), titleDe: clean("titleDe"),
      copyEn: clean("copyEn", 1000), copyDe: clean("copyDe", 1000),
      buttonEn: clean("buttonEn", 120), buttonDe: clean("buttonDe", 120)
    };
    if (next.image && !isAllowedImageUrl(next.image)) return NextResponse.json({ error: "Ungültige Bildadresse. Erlaubt sind https-Adressen von Vercel Blob, Unsplash oder GitHub (raw.githubusercontent.com)." }, { status: 400 });
    await writeSettings(next, "Update homepage content", sha);
    if (old.image && old.image !== next.image) {
      try { await removeUnusedBlob(old.image); } catch (e) { console.warn("Old homepage image cleanup skipped:", e); }
    }
    return NextResponse.json({ ok: true, settings: next, deploymentTriggered: true });
  } catch (e) { return NextResponse.json({ error: e.message || "Speichern fehlgeschlagen." }, { status: 500 }); }
}
export async function DELETE(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const { settings: old, sha } = await readLiveSettings();
    const next = { ...old, image: "" };
    await writeSettings(next, "Remove homepage image", sha);
    let blobDeleted = false;
    if (old.image) {
      try { blobDeleted = await removeUnusedBlob(old.image); } catch (e) { console.warn("Homepage image cleanup skipped:", e); }
    }
    return NextResponse.json({ ok: true, blobDeleted, deploymentTriggered: true });
  } catch (e) { return NextResponse.json({ error: e.message || "Löschen fehlgeschlagen." }, { status: 500 }); }
}