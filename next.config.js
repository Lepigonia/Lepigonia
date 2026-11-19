const isProduction = process.env.NODE_ENV === "production";

// Content-Security-Policy.
// 'unsafe-inline' is needed for Next.js' inline bootstrap scripts and React style attributes until a
// nonce-based setup is introduced; the remaining directives (connect-src, form-action, base-uri,
// object-src, frame-ancestors) still limit what injected markup could do.
// Set CSP_REPORT_ONLY=1 (build-time env var) to log violations in the browser console without blocking.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cloud.umami.is",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://cloud.umami.is https://api-gateway.umami.dev https://vercel.com https://blob.vercel-storage.com https://*.blob.vercel-storage.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Keep in sync with lib/media.js (isAllowedImageUrl).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  compress: true,
  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ];
    if (isProduction) {
      headers.push({
        key: process.env.CSP_REPORT_ONLY === "1" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
        value: contentSecurityPolicy,
      });
    }
    return [{ source: "/:path*", headers }];
  },
};
module.exports = nextConfig;