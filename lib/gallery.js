import { getGallery as getDatabaseGallery, slugifyCountry } from "./db";

export async function getGalleryData() {
  return getDatabaseGallery({ syncPosts: true });
}

export { slugifyCountry };
