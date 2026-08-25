import { NextResponse } from "next/server";
import { getPosts } from "../../../../lib/posts";
import { getGithubFile, putGithubFile, deleteGithubFile, isAdmin } from "../../../../lib/admin";
import { ensureDatabase, sql } from "../../../../lib/db";

export const dynamic = "force-dynamic";

function extractImageUrls(content) {
  const urls = [];
  const re = /(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi;
  let match;
  while ((match = re.exec(String(content || "")))) urls.push({ full: match[0], url: match[2] });
  return urls;
}

function filenameFromUrl(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() || "").toLowerCase();
  } catch {
    return "";
  }
}

async function canonicalizeGalleryUrls(content) {
  const entries = extractImageUrls(content);
  if (!entries.length) return String(content || "");

  try {
    await ensureDatabase();
    const db = sql();
    const images = await db`SELECT url, filename, created_at FROM gallery_images WHERE storage='blob' ORDER BY created_at DESC`;
    if (!images.length) return String(content || "");

    const byFilename = new Map();
    for (const image of images) {
      const filename = String(image.filename || filenameFromUrl(image.url)).toLowerCase();
      if (filename && !byFilename.has(filename)) byFilename.set(filename, image.url);
    }

    let result = String(content || "");
    for (const entry of entries) {
      if (!entry.url || !/^https?:\/\//i.test(entry.url)) continue;
      const exact = images.find((image) => image.url === entry.url);
      if (exact?.url) continue;

      const filename = filenameFromUrl(entry.url);
      const replacement = filename ? byFilename.get(filename) : null;
      if (replacement && replacement !== entry.url) {
        result = result.split(entry.url).join(replacement);
      }
    }
    return result;
  } catch (error) {
    // Saving a story must never fail only because the optional URL repair could not run.
    console.warn("Gallery URL canonicalization skipped:", error?.message || error);
    return String(content || "");
  }
}

export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  return NextResponse.json({ posts: getPosts() });
}

export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const post = await request.json();
    if (!post.slug || !/^[a-z0-9-]+$/.test(post.slug)) return NextResponse.json({ error: "Der Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten." }, { status: 400 });

    const lat = post.lat === "" || post.lat == null ? "" : Number(post.lat);
    const lng = post.lng === "" || post.lng == null ? "" : Number(post.lng);
    if (lat !== "" && (!Number.isFinite(lat) || lat < -90 || lat > 90)) return NextResponse.json({ error: "Breitengrad muss zwischen -90 und 90 liegen." }, { status: 400 });
    if (lng !== "" && (!Number.isFinite(lng) || lng < -180 || lng > 180)) return NextResponse.json({ error: "Längengrad muss zwischen -180 und 180 liegen." }, { status: 400 });

    const content = await canonicalizeGalleryUrls(post.content || "");
    const frontmatter = ["title", "date", "location", "country", "lat", "lng", "image", "excerpt"].map((key) => `${key}: ${String(key === "lat" ? lat : key === "lng" ? lng : post[key] || "").replace(/\n/g, " ")}`).join("\n");
    const fileContent = `---\n${frontmatter}\n---\n\n${String(content).trim()}\n`;

    let sha;
    try { sha = (await getGithubFile(`posts/${post.slug}.md`)).sha; } catch {}
    await putGithubFile(`posts/${post.slug}.md`, fileContent, `${sha ? "Update" : "Add"} post: ${post.title || post.slug}`, sha);
    return NextResponse.json({ ok: true, canonicalized: content !== String(post.content || "") });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Speichern fehlgeschlagen." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const { slug } = await request.json();
    const file = await getGithubFile(`posts/${slug}.md`);
    await deleteGithubFile(`posts/${slug}.md`, `Delete post: ${slug}`, file.sha);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Löschen fehlgeschlagen." }, { status: 500 });
  }
}
