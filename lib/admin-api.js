export async function adminRequest(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request fehlgeschlagen (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const jsonRequest = (path, method, body) =>
  adminRequest(path, { method, body: JSON.stringify(body) });

export const adminApi = {
  posts: () => adminRequest("/api/admin/posts"),
  savePost: (post) => jsonRequest("/api/admin/posts", "POST", post),
  deletePost: (slug) => jsonRequest("/api/admin/posts", "DELETE", { slug }),
  gallery: () => adminRequest("/api/admin/gallery"),
  galleryAction: (body) => jsonRequest("/api/admin/gallery", "POST", body),
  registerGalleryImage: ({ slug, url, filename, storage = "blob" }) =>
    jsonRequest("/api/admin/gallery", "POST", {
      action: "image-register",
      slug,
      url,
      filename,
      storage,
    }),
  about: () => adminRequest("/api/admin/about"),
  saveAbout: (about) => jsonRequest("/api/admin/about", "POST", about),
  login: (credentials) => jsonRequest("/api/admin/login", "POST", credentials),
  logout: () => adminRequest("/api/admin/logout", { method: "POST" }),
};
