import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
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

function pathnameFromUrl(url) {
  try { return new URL(url).pathname; }
  catch { return ""; }
}

function isGalleryAsset(url) {
  return /^\/gallery\//i.test(pathnameFromUrl(url));
}

function isBlogAsset(url) {
  return /^\/blog\//i.test(pathnameFromUrl(url));
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
    console.warn("Gallery URL canonicalization skipped:", error?.message || error);
    return String(content || "");
  }
}

async function getPostImageUrls(post) {
  return [...new Set([post?.image, ...extractImageUrls(post?.content || []).map((entry) => entry.url)].filter(Boolean))];
}

async function getActivePostImageUrls(excludeSlug = "") {
  const posts = getPosts();
  return new Set(
    posts
      .filter((post) => post.slug !== excludeSlug)
      .flatMap((post) => [post.image, ...extractImageUrls(post.content || "").map((entry) => entry.url)])
      .filter(Boolean)
  );
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
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: "Ungültiger Slug." }, { status: 400 });

    const file = await getGithubFile(`posts/${slug}.md`);
    const post = getPosts().find((item) => item.slug === slug);
    const postUrls = await getPostImageUrls(post || {});
    const blogUrlsFromPost = postUrls.filter(isBlogAsset);
    const activePostUrls = await getActivePostImageUrls(slug);

    await ensureDatabase();
    const db = sql();

    // Only records explicitly owned by this post are candidates for removal.
    // A gallery URL embedded in a story is only a reference and is NEVER
    // deleted from gallery_images or Vercel Blob.
    const ownedRows = await db`SELECT id,url,source,storage FROM gallery_images WHERE source='blog' AND post_slug=${slug}`;
    const candidateUrls = [...new Set([
      ...ownedRows.map((row) => row.url),
      ...blogUrlsFromPost,
    ].filter(isBlogAsset))];

    // Delete the source post first. If this fails, no gallery/Blob cleanup is
    // performed, so a failed GitHub deletion cannot leave half-finished state.
    await deleteGithubFile(`posts/${slug}.md`, `Delete post: ${slug}`, file.sha);

    // Remove all gallery records owned by the deleted post. This is safe even
    // when one of the post's images was also referenced by another post: the
    // Blob itself is protected by the remaining-reference check below.
    await db`DELETE FROM gallery_images WHERE source='blog' AND post_slug=${slug}`;

    // Legacy data may have registered a /blog/ asset as a manual gallery item.
    // Remove only the exact assets used by this post; never touch /gallery/ URLs.
    if (candidateUrls.length) {
      await db`DELETE FROM gallery_images
        WHERE url=ANY(${candidateUrls})
          AND (source='blog' OR source='manual')`;
    }

    const remainingRows = candidateUrls.length
      ? await db`SELECT url FROM gallery_images WHERE url=ANY(${candidateUrls})`
      : [];
    const remainingUrls = new Set(remainingRows.map((row) => row.url));

    // Never delete a Blob that another live post still references. Gallery
    // assets are excluded by candidateUrls and therefore can never be deleted
    // as a side effect of deleting a story.
    const blobsToDelete = candidateUrls.filter((url) => !remainingUrls.has(url) && !activePostUrls.has(url));
    await Promise.allSettled(blobsToDelete.map((url) => del(url)));

    return NextResponse.json({
      ok: true,
      removedGalleryImages: ownedRows.length,
      removedBlogAssets: blobsToDelete.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Löschen fehlgeschlagen." }, { status: 500 });
  }
}
