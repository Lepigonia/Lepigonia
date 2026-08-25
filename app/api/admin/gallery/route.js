import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { isAdmin } from "../../../../lib/admin";
import { getGallery, ensureDatabase, seedGalleryFromLegacy, sql, slugifyCountry } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    return NextResponse.json(await getGallery({ syncPosts: true }));
  } catch (error) {
    return NextResponse.json({ error: error.message || "Galerie konnte nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    await seedGalleryFromLegacy();
    const db = sql();
    const body = await request.json();

    if (body.action === "country-create") {
      const name = String(body.name || "").trim();
      const slug = slugifyCountry(name);
      if (!name || !slug) return NextResponse.json({ error: "Bitte ein Land eingeben." }, { status: 400 });
      const existing = await db`SELECT id FROM gallery_countries WHERE slug=${slug} LIMIT 1`;
      if (existing.length) return NextResponse.json({ error: "Dieses Land existiert bereits." }, { status: 409 });
      await db`INSERT INTO gallery_countries (id,slug,name) VALUES (${slug},${slug},${name})`;
      return NextResponse.json({ ok: true, slug });
    }

    if (body.action === "country-update") {
      const oldSlug = String(body.slug || "");
      const name = String(body.name || "").trim();
      const newSlug = slugifyCountry(name);
      if (!name || !newSlug) return NextResponse.json({ error: "Bitte ein Land eingeben." }, { status: 400 });
      const country = (await db`SELECT id FROM gallery_countries WHERE slug=${oldSlug} LIMIT 1`)[0];
      if (!country) return NextResponse.json({ error: "Land nicht gefunden." }, { status: 404 });
      const duplicate = await db`SELECT id FROM gallery_countries WHERE slug=${newSlug} AND id<>${country.id} LIMIT 1`;
      if (duplicate.length) return NextResponse.json({ error: "Dieses Land existiert bereits." }, { status: 409 });
      await db`UPDATE gallery_countries SET slug=${newSlug},name=${name},updated_at=NOW() WHERE id=${country.id}`;
      return NextResponse.json({ ok: true, slug: newSlug });
    }

    if (body.action === "country-delete") {
      const country = (await db`SELECT id,name FROM gallery_countries WHERE slug=${body.slug} LIMIT 1`)[0];
      if (!country) return NextResponse.json({ error: "Land nicht gefunden." }, { status: 404 });
      const manual = await db`SELECT url FROM gallery_images WHERE country_id=${country.id} AND source='manual' AND storage='blob'`;
      await db`DELETE FROM gallery_countries WHERE id=${country.id}`;
      await Promise.allSettled(manual.map(image => image.url ? del(image.url) : null));
      return NextResponse.json({ ok: true });
    }

    if (body.action === "image-register") {
      const country = (await db`SELECT id FROM gallery_countries WHERE slug=${body.slug} LIMIT 1`)[0];
      if (!country) return NextResponse.json({ error: "Land nicht gefunden." }, { status: 404 });
      if (!body.url || !body.filename) return NextResponse.json({ error: "Bild-URL oder Dateiname fehlt." }, { status: 400 });
      const id = `manual-${crypto.randomUUID()}`;
      await db`INSERT INTO gallery_images (id,country_id,source,url,filename,storage,created_at)
        VALUES (${id},${country.id},'manual',${body.url},${body.filename},'blob',NOW())
        ON CONFLICT (country_id,source,filename) DO NOTHING`;
      return NextResponse.json({ ok: true, url: body.url, id });
    }

    if (body.action === "image-delete") {
      const image = (await db`SELECT id,url,source,storage FROM gallery_images WHERE id=${body.id} LIMIT 1`)[0];
      if (!image) return NextResponse.json({ error: "Bild nicht gefunden." }, { status: 404 });
      if (image.source === "blog") return NextResponse.json({ error: "Blogbilder werden automatisch aus den Stories übernommen und hier nicht gelöscht." }, { status: 400 });
      await db`DELETE FROM gallery_images WHERE id=${image.id}`;
      if (image.storage === "blob" && image.url) await del(image.url);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Galerie konnte nicht gespeichert werden." }, { status: 500 });
  }
}
