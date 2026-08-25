import { NextResponse } from "next/server";
import { getGithubFile, putGithubFile, putGithubBinary, deleteGithubFile, isAdmin } from "../../../../lib/admin";
import { slugifyCountry } from "../../../../lib/gallery";
import { getPosts } from "../../../../lib/posts";

async function readData() {
  try { const f = await getGithubFile("data/gallery.json"); return { data: JSON.parse(Buffer.from(f.content, "base64").toString("utf8")), sha: f.sha }; }
  catch { return { data: { countries: [] }, sha: null }; }
}
async function writeData(data, sha) { return putGithubFile("data/gallery.json", JSON.stringify(data, null, 2) + "\n", "Update gallery", sha); }

function withBlogImages(data) {
  const posts = getPosts();
  const countries = data.countries.map(c => ({ ...c, images: [...(c.images || [])] }));
  for (const post of posts) {
    if (!post.country || !post.image) continue;
    const c = countries.find(x => slugifyCountry(x.name) === slugifyCountry(post.country));
    if (!c) continue;
    const id = `post-${post.slug}`;
    if (!c.images.some(i => i.id === id)) {
      c.images.unshift({ id, url: post.image, source: "blog", postSlug: post.slug, title: post.title || "Blogartikel" });
    }
  }
  return { countries };
}

export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  return NextResponse.json(withBlogImages((await readData()).data));
}

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const body = await request.json(); const { data, sha } = await readData();
    if (body.action === "country-create") {
      const name = String(body.name || "").trim(); const slug = slugifyCountry(name);
      if (!name || !slug) return NextResponse.json({ error: "Bitte ein Land eingeben." }, { status: 400 });
      if (data.countries.some(c => c.slug === slug)) return NextResponse.json({ error: "Dieses Land existiert bereits." }, { status: 409 });
      data.countries.push({ id: slug, slug, name, images: [] }); await writeData(data, sha); return NextResponse.json({ ok: true });
    }
    if (body.action === "country-update") {
      const c = data.countries.find(x => x.slug === body.slug); if (!c) return NextResponse.json({ error: "Land nicht gefunden." }, { status: 404 });
      const name = String(body.name || "").trim(); if (!name) return NextResponse.json({ error: "Bitte ein Land eingeben." }, { status: 400 });
      c.name = name; c.slug = slugifyCountry(name); await writeData(data, sha); return NextResponse.json({ ok: true });
    }
    if (body.action === "country-delete") {
      data.countries = data.countries.filter(c => c.slug !== body.slug); await writeData(data, sha); return NextResponse.json({ ok: true });
    }
    if (body.action === "image-delete") {
      const c = data.countries.find(x => x.slug === body.slug); const image = c?.images?.find(i => i.id === body.id);
      if (!c || !image) return NextResponse.json({ error: "Bild nicht gefunden." }, { status: 404 });
      if (image.source === "blog") return NextResponse.json({ error: "Blogbilder werden automatisch aus den Stories übernommen und hier nicht gelöscht." }, { status: 400 });
      c.images = c.images.filter(i => i.id !== body.id); await writeData(data, sha);
      try { const file = await getGithubFile(`public/uploads/${image.filename}`); await deleteGithubFile(`public/uploads/${image.filename}`, `Delete gallery image: ${image.filename}`, file.sha); } catch {}
      return NextResponse.json({ ok: true });
    }
    if (body.action === "image-add") {
      const c = data.countries.find(x => x.slug === body.slug); if (!c) return NextResponse.json({ error: "Land nicht gefunden." }, { status: 404 });
      const prepared = body.data; if (!prepared?.startsWith("data:image/")) return NextResponse.json({ error: "Ungültiges Bild." }, { status: 400 });
      const match = prepared.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i); if (!match) return NextResponse.json({ error: "Ungültige Bilddaten." }, { status: 400 });
      const bytes = Math.floor(match[2].length * 3 / 4); if (bytes > 900 * 1024) return NextResponse.json({ error: "Das optimierte Bild ist noch zu groß. Bitte erneut versuchen." }, { status: 400 });
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.webp`;
      await putGithubBinary(`public/uploads/gallery-${filename}`, prepared, `Add gallery image: ${filename}`);
      c.images.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, filename: `gallery-${filename}`, url: `/uploads/gallery-${filename}`, source: "manual", createdAt: new Date().toISOString() });
      await writeData(data, sha); return NextResponse.json({ ok: true, url: `/uploads/gallery-${filename}` });
    }
    return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) { return NextResponse.json({ error: error.message || "Galerie konnte nicht gespeichert werden." }, { status: 500 }); }
}
