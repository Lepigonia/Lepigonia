import { NextResponse } from "next/server";
import { getGallery } from "../../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCache = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    // Read-only: blog images are mirrored into the gallery when a post is saved and when the admin area
    // loads - never as a side effect of a public page view.
    const data = await getGallery();
    return NextResponse.json(data, { headers: noCache });
  } catch (error) {
    console.error("Gallery request failed:", error?.message || error);
    return NextResponse.json({ error: "Galerie konnte nicht geladen werden.", countries: [] }, { status: 500, headers: noCache });
  }
}