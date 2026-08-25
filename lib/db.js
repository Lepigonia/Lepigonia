import { neon } from "@neondatabase/serverless";

let readyPromise;

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL fehlt. Bitte Neon/Postgres mit dem Vercel-Projekt verbinden.");
  return neon(process.env.DATABASE_URL);
}

export function sql() {
  return getSql();
}

export async function ensureDatabase() {
  if (!readyPromise) {
    const db = getSql();
    readyPromise = (async () => {
      await db`CREATE TABLE IF NOT EXISTS gallery_countries (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await db`CREATE TABLE IF NOT EXISTS gallery_images (
        id TEXT PRIMARY KEY,
        country_id TEXT NOT NULL REFERENCES gallery_countries(id) ON DELETE CASCADE,
        source TEXT NOT NULL CHECK (source IN ('manual','blog')),
        post_slug TEXT,
        url TEXT NOT NULL,
        filename TEXT,
        storage TEXT NOT NULL DEFAULT 'blob',
        title TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (country_id, source, post_slug),
        UNIQUE (country_id, source, filename)
      )`;
      await db`CREATE INDEX IF NOT EXISTS gallery_images_country_idx ON gallery_images(country_id)`;
      await db`CREATE INDEX IF NOT EXISTS gallery_images_post_idx ON gallery_images(post_slug)`;
      return true;
    })().catch(error => { readyPromise = undefined; throw error; });
  }
  return readyPromise;
}

export async function seedGalleryFromLegacy() {
  await ensureDatabase();
  const db = getSql();
  const count = await db`SELECT COUNT(*)::int AS count FROM gallery_countries`;
  if (count[0]?.count > 0) return;

  try {
    const { getGithubFile } = await import("./admin");
    const file = await getGithubFile("data/gallery.json");
    const legacy = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
    for (const country of legacy.countries || []) {
      await db`INSERT INTO gallery_countries (id, slug, name) VALUES (${country.id || country.slug}, ${country.slug}, ${country.name}) ON CONFLICT (slug) DO NOTHING`;
      const countryId = country.id || country.slug;
      for (const image of country.images || []) {
        const id = image.id || `legacy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await db`INSERT INTO gallery_images (id,country_id,source,post_slug,url,filename,storage,title,created_at)
          VALUES (${id},${countryId},${image.source === "blog" ? "blog" : "manual"},${image.postSlug || null},${image.url},${image.filename || null},${image.storage || "blob"},${image.title || null},${image.createdAt || new Date().toISOString()})
          ON CONFLICT DO NOTHING`;
      }
    }
  } catch {
    // A missing legacy file is fine; the database simply starts empty.
  }
}

export async function getGallery({ syncPosts = true } = {}) {
  await seedGalleryFromLegacy();
  const db = getSql();
  if (syncPosts) await syncBlogImages();
  const countries = await db`SELECT id, slug, name FROM gallery_countries ORDER BY name ASC`;
  const images = await db`SELECT id,country_id,source,post_slug,url,filename,storage,title,created_at FROM gallery_images ORDER BY created_at DESC`;
  const byCountry = new Map(countries.map(c => [c.id, []]));
  for (const image of images) {
    if (!byCountry.has(image.country_id)) byCountry.set(image.country_id, []);
    byCountry.get(image.country_id).push({
      id: image.id, url: image.url, source: image.source, postSlug: image.post_slug,
      filename: image.filename, storage: image.storage, title: image.title,
      createdAt: image.created_at,
    });
  }
  return { countries: countries.map(c => ({ ...c, images: byCountry.get(c.id) || [] })) };
}

export async function syncBlogImages() {
  const db = getSql();
  const { getPosts } = await import("./posts");
  const posts = getPosts();
  for (const post of posts) {
    if (!post.country || !post.image) continue;
    const country = (await db`SELECT id FROM gallery_countries WHERE lower(slug)=lower(${slugifyCountry(post.country)}) OR lower(name)=lower(${post.country}) LIMIT 1`)[0];
    if (!country) continue;
    await db`INSERT INTO gallery_images (id,country_id,source,post_slug,url,filename,storage,title)
      VALUES (${`post-${post.slug}`},${country.id},'blog',${post.slug},${post.image},NULL,'blob',${post.title || "Blogartikel"})
      ON CONFLICT (id) DO UPDATE SET country_id=EXCLUDED.country_id,url=EXCLUDED.url,title=EXCLUDED.title,post_slug=EXCLUDED.post_slug`;
  }
  const slugs = posts.filter(p => p.country && p.image).map(p => p.slug);
  if (slugs.length) await db`DELETE FROM gallery_images WHERE source='blog' AND NOT (post_slug = ANY(${slugs}))`;
  else await db`DELETE FROM gallery_images WHERE source='blog'`;
}

export function slugifyCountry(name) {
  return String(name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
