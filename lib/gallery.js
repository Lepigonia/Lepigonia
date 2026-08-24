import { getGithubFile } from "./admin";

export async function getGalleryData() {
  try {
    const file = await getGithubFile("data/gallery.json");
    return JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
  } catch { return { countries: [] }; }
}

export function slugifyCountry(name) {
  return String(name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
