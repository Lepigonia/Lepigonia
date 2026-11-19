// Hosts must match images.remotePatterns in next.config.js.
const STATIC_HOSTS = new Set(["images.unsplash.com", "raw.githubusercontent.com"]);
const BLOB_SUFFIX = ".public.blob.vercel-storage.com";

function parseHttps(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

/** Only Vercel Blob URLs (used for gallery uploads). */
export function isBlobImageUrl(value) {
  const url = parseHttps(value);
  return Boolean(url && url.hostname.toLowerCase().endsWith(BLOB_SUFFIX));
}

/** https URLs on hosts that next/image is allowed to optimize. */
export function isAllowedImageUrl(value) {
  const url = parseHttps(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  return STATIC_HOSTS.has(host) || host.endsWith(BLOB_SUFFIX);
}