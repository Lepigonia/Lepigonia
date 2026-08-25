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

export const adminApi = {
  posts: () => adminRequest("/api/admin/posts"),
  savePost: (post) => adminRequest("/api/admin/posts", { method: "POST", body: JSON.stringify(post) }),
  deletePost: (slug) => adminRequest("/api/admin/posts", { method: "DELETE", body: JSON.stringify({ slug }) }),
  gallery: () => adminRequest("/api/admin/gallery"),
  galleryAction: (body) => adminRequest("/api/admin/gallery", { method: "POST", body: JSON.stringify(body) }),
  about: () => adminRequest("/api/admin/about"),
  saveAbout: (about) => adminRequest("/api/admin/about", { method: "POST", body: JSON.stringify(about) }),
  login: (credentials) => adminRequest("/api/admin/login", { method: "POST", body: JSON.stringify(credentials) }),
  logout: () => adminRequest("/api/admin/logout", { method: "POST" }),
};
