import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { isAdmin } from "../../../../lib/admin";
import { ensureDatabase, sql, getHomepageSettings } from "../../../../lib/db";
import { getPosts } from "../../../../lib/posts";
export const dynamic = "force-dynamic";
async function removeUnusedBlob(url) {
  if (!url) return false;
  const db = sql();
  const gallery = await db`SELECT id FROM gallery_images WHERE url=${url} LIMIT 1`;
  const posts = getPosts().some((post) => post.image === url || String(post.content || "").includes(url));
  if (gallery.length || posts) return false;
  await del(url); return true;
}
export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try { return NextResponse.json(await getHomepageSettings()); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    await ensureDatabase(); const db = sql(); const body = await request.json(); const old = await getHomepageSettings();
    const clean = (key, max=500) => String(body[key] ?? old[key] ?? "").trim().slice(0,max);
    const next = { image: clean("image",2000), imageAlt: clean("imageAlt",240), eyebrowEn: clean("eyebrowEn"), eyebrowDe: clean("eyebrowDe"), titleEn: clean("titleEn"), titleDe: clean("titleDe"), copyEn: clean("copyEn",1000), copyDe: clean("copyDe",1000), buttonEn: clean("buttonEn",120), buttonDe: clean("buttonDe",120) };
    if (next.image && !next.image.startsWith("https://")) return NextResponse.json({error:"Ungültige Bildadresse."},{status:400});
    await db`INSERT INTO site_settings(key,value,updated_at) VALUES('homepage',${JSON.stringify(next)}::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`;
    if (old.image && old.image !== next.image) { try { await removeUnusedBlob(old.image); } catch (e) { console.warn(e); } }
    return NextResponse.json({ok:true,settings:next});
  } catch(e) { return NextResponse.json({error:e.message || "Speichern fehlgeschlagen."},{status:500}); }
}
export async function DELETE(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try { await ensureDatabase(); const old = await getHomepageSettings(); const db = sql(); const next = {...old,image:""};
    await db`INSERT INTO site_settings(key,value,updated_at) VALUES('homepage',${JSON.stringify(next)}::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`;
    const blobDeleted = old.image ? await removeUnusedBlob(old.image) : false;
    return NextResponse.json({ok:true,blobDeleted});
  } catch(e) { return NextResponse.json({error:e.message || "Löschen fehlgeschlagen."},{status:500}); }
}