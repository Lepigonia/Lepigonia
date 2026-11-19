export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/api/", "/newsletter/"] },
    sitemap: "https://lepigonia.vercel.app/sitemap.xml",
  };
}