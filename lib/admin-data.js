import { adminApi } from "./admin-api";

export async function loadAdminData() {
  const [postData, galleryData, aboutData] = await Promise.all([
    adminApi.posts(),
    adminApi.gallery(),
    adminApi.about(),
  ]);

  return {
    posts: postData.posts || [],
    countries: galleryData.countries || [],
    about: aboutData,
  };
}
