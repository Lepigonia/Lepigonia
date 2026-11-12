import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

async function umamiGet(path) {
  const apiKey = process.env.UMAMI_API_KEY;
  if (!apiKey) throw new Error("UMAMI_API_KEY_MISSING");

  const response = await fetch(`https://api.umami.is/v1${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Umami API request failed:", response.status, detail.slice(0, 500));
    throw new Error(response.status === 401 || response.status === 403 ? "UMAMI_API_UNAUTHORIZED" : "UMAMI_API_ERROR");
  }

  return response.json();
}

export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });

  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!websiteId) return NextResponse.json({ error: "Die Umami-Website-ID fehlt." }, { status: 503 });

  const requestedRange = Number(new URL(request.url).searchParams.get("range") || 7);
  const range = [7, 30, 90].includes(requestedRange) ? requestedRange : 7;
  const endAt = Date.now();
  const startAt = endAt - range * DAY;
  const params = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
    timezone: "Europe/Berlin",
  });

  try {
    const [stats, pageviews, pages, referrers, countries] = await Promise.all([
      umamiGet(`/websites/${encodeURIComponent(websiteId)}/stats?${params}`),
      umamiGet(`/websites/${encodeURIComponent(websiteId)}/pageviews?${params}&unit=day`),
      umamiGet(`/websites/${encodeURIComponent(websiteId)}/metrics?${params}&type=url&limit=8`),
      umamiGet(`/websites/${encodeURIComponent(websiteId)}/metrics?${params}&type=referrer&limit=6`),
      umamiGet(`/websites/${encodeURIComponent(websiteId)}/metrics?${params}&type=country&limit=6`),
    ]);

    return NextResponse.json({
      range,
      stats,
      pageviews: Array.isArray(pageviews?.pageviews) ? pageviews.pageviews : Array.isArray(pageviews) ? pageviews : [],
      pages: Array.isArray(pages) ? pages : [],
      referrers: Array.isArray(referrers) ? referrers : [],
      countries: Array.isArray(countries) ? countries : [],
      updatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error.message === "UMAMI_API_KEY_MISSING") {
      return NextResponse.json({ error: "UMAMI_API_KEY_MISSING" }, { status: 503 });
    }
    if (error.message === "UMAMI_API_UNAUTHORIZED") {
      return NextResponse.json({ error: "UMAMI_API_UNAUTHORIZED" }, { status: 502 });
    }
    return NextResponse.json({ error: "UMAMI_API_ERROR" }, { status: 502 });
  }
}
