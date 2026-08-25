import { upload } from "@vercel/blob/client";

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function uploadAdminBlob(path, file, onUploadProgress) {
  return upload(path, file, {
    access: "public",
    handleUploadUrl: "/api/admin/blob-upload",
    multipart: true,
    onUploadProgress,
  });
}

export function createBlogUploadPath(file) {
  return `blog/${Date.now()}-${safeFilename(file.name)}`;
}

export function createGalleryUploadPath(gallery, file) {
  return `gallery/${gallery}/${Date.now()}-${safeFilename(file.name)}`;
}
