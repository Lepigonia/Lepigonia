import { NextResponse } from "next/server";
import { getGalleryData } from "../../../lib/gallery";
import { getPosts } from "../../../lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getGalleryData();
  const posts = getPosts();
  const countries = (data.countries || []).map(country => {
    const manual = country.images || [];
    const blog = posts.filter(p => {
      const value = String(p.country || p.location || "").toLowerCase();
      return value === String(country.name).toLowerCase() || value.includes(String(country.name).toLowerCase());
    }).flatMap(p => p.image ? [{ id: `post-${p.slug}`, url: p.image, source: "blog", postSlug: p.slug, title: p.title }] : []);
    return { ...country, images: [...blog, ...manual] };
  });
  return NextResponse.json({ countries });
}
