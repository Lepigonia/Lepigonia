import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { verifyAdmin } from "../../../../lib/admin";
import { getGallery, ensureDatabase, sql, slugifyCountry } from "../../../../lib/db";
import { getLivePostSlugs } from "../../../../lib/github-posts";
import { isBlobImageUrl } from "../../../../lib/media";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    // `postExists` must reflect the repository right now, not the last deployment.
    let postSlugs = null;
    try { postSlugs = await getLivePostSlugs(); }
    catch (error) { console.warn("Live post slugs unavailable, using deployed snapshot:", error?.message || error); }
    return NextResponse.json(await getGallery({ syncPosts: true, postSlugs }));
  } catch (error) {
    return NextResponse.json({ error: error.message || "Galerie konnte nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    await ensureDatabase();
    const db = sql();
    const body = await request.json();

    if (body.action === "country-create") {
      const name = String(body.name || "").trim();
      const slug = slugifyCountry(name);
      if (!name || !slug) return NextResponse.json({ error: "Bitte ein Land eingeben." }, { status: 400 });
      const existing = await db`SELECT id FROM gallery_countries WHERE slug=${slug} OR lower(name)=lower(${name}) LIMIT 1`;
      if (existing.length) return NextResponse.json({ error: "Dieses Land existiert bereits." }, { status: 409 });
      const alias = await db`SELECT country_id FROM gallery_country_aliases WHERE alias_slug=${slug} LIMIT 1`;
      if (alias.length) return NextResponse.json({ error: "Dieser Ländername ist bereits als frühere Bezeichnung vergeben." }, { status: 409 });
      await db`INSERT INTO gallery_countries (id,slug,name) VALUES (${crypto.randomUUID()},${slug},${name})`;
      return NextResponse.json({ ok: true, slug });
    }

    if (body.action === "country-update") {
      const oldSlug = String(body.slug || "");
      const name = String(body.name || "").trim();
      const newSlug = slugifyCountry(name);
      if (!name || !newSlug) return NextResponse.json({ error: "Bitte ein Land eingeben." }, { status: 400 });
      const country = (await db`SELECT id,slug FROM gallery_countries WHERE slug=${oldSlug} LIMIT 1`)[0];
      if (!country) return NextResponse.json({ error: "Land nicht gefunden." }, { status: 404 });
      const duplicate = await db`SELECT id FROM gallery_countries WHERE slug=${newSlug} AND id<>${country.id} LIMIT 1`;
      if (duplicate.length) return NextResponse.json({ error: "Dieses Land existiert bereits." }, { status: 409 });
      const aliasDuplicate = await db`SELECT country_id FROM gallery_country_aliases WHERE alias_slug=${newSlug} AND country_id<>${country.id} LIMIT 1`;
      if (aliasDuplicate.length) return NextResponse.json({ error: "Dieser Ländername ist bereits als Alias vergeben." }, { status: 409 });
      if (country.slug !== newSlug) {
        await db`INSERT INTO gallery_country_aliases(alias_slug,country_id) VALUES(${country.slug},${country.id}) ON CONFLICT(alias_slug) DO UPDATE SET country_id=EXCLUDED.country_id`;
      }
      await db`UPDATE gallery_countries SET slug=${newSlug},name=${name},updated_at=NOW() WHERE id=${country.id}`;
      await db`DELETE FROM gallery_country_aliases WHERE alias_slug=${newSlug}`;
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
      if (!isBlobImageUrl(body.url)) return NextResponse.json({ error: "Ungültige Bild-URL: Es sind nur Vercel-Blob-Adressen (https) erlaubt." }, { status: 400 });
      const filename = String(body.filename).slice(0, 300);
      const source = body.source === "blog" ? "blog" : "manual";
      const postSlug = source === "blog" ? (body.postSlug || null) : null;
      const id = source === "blog" && postSlug ? `post-${postSlug}-${Buffer.from(body.url).toString("base64url").slice(-32)}` : `manual-${crypto.randomUUID()}`;
      await db`INSERT INTO gallery_images (id,country_id,source,post_slug,url,filename,storage,created_at)
        VALUES (${id},${country.id},${source},${postSlug},${body.url},${filename},'blob',NOW())
        ON CONFLICT (id) DO UPDATE SET country_id=EXCLUDED.country_id,url=EXCLUDED.url,filename=EXCLUDED.filename,storage=EXCLUDED.storage`;
      return NextResponse.json({ ok: true, url: body.url, id });
    }

    if (body.action === "image-delete") {
      const image = (await db`SELECT id,url,source,post_slug,storage FROM gallery_images WHERE id=${body.id} LIMIT 1`)[0];
      if (!image) return NextResponse.json({ error: "Bild nicht gefunden." }, { status: 404 });

      if (image.source === "blog") {
        // Ask GitHub, not the last deployment: a post saved a minute ago must still protect its images.
        let liveSlugs;
        try { liveSlugs = await getLivePostSlugs(); }
        catch (error) {
          console.error("Live post check failed:", error?.message || error);
          return NextResponse.json({ error: "Der aktuelle Stand der Beiträge konnte nicht von GitHub geladen werden. Zur Sicherheit wurde nichts gelöscht - bitte später erneut versuchen." }, { status: 502 });
        }
        if (liveSlugs.has(image.post_slug)) {
          return NextResponse.json({
            error: "Dieses Bild gehört noch zu einem bestehenden Blogartikel. Entferne es dort aus dem Artikel, statt das Asset direkt aus der Galerie zu löschen.",
          }, { status: 409 });
        }
      }

      // Never delete the underlying Blob if another gallery record still uses
      // the exact same URL. This protects shared assets from one post's cleanup.
      const shared = image.url
        ? await db`SELECT id FROM gallery_images WHERE url=${image.url} AND id<>${image.id} LIMIT 1`
        : [];

      await db`DELETE FROM gallery_images WHERE id=${image.id}`;
      if (!shared.length && image.storage === "blob" && image.url) await del(image.url);
      return NextResponse.json({ ok: true, blobDeleted: !shared.length });
    }

    return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Galerie konnte nicht gespeichert werden." }, { status: 500 });
  }
}