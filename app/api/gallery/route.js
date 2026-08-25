import { NextResponse } from "next/server";
import { getGalleryData } from "../../../lib/gallery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getGalleryData());
  } catch (error) {
    return NextResponse.json({ error: error.message || "Galerie konnte nicht geladen werden.", countries: [] }, { status: 500 });
  }
}
