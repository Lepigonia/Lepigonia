"use client";

import { upload } from "@vercel/blob/client";
import { useCallback, useState } from "react";
import { adminApi } from "../lib/admin-api";

export function useAdminActions({ data, gallery, setGallery, setPost, setSection }) {
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const clearMessages = useCallback(() => {
    setError("");
    setStatus("");
  }, []);

  const refresh = useCallback(async () => {
    const result = await data.reload();
    if (result && !gallery && result.countries[0]) setGallery(result.countries[0].slug);
    return result;
  }, [data, gallery, setGallery]);

  const logout = useCallback(async () => {
    await adminApi.logout();
    window.location.reload();
  }, []);

  const savePost = useCallback(async (event, post) => {
    event.preventDefault();
    clearMessages();
    setStatus("Speichere …");
    try {
      await adminApi.savePost(post);
      setStatus("Gespeichert – Vercel veröffentlicht automatisch.");
      await refresh();
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }, [clearMessages, refresh]);

  const deletePost = useCallback(async (slug, blankPost) => {
    if (!confirm("Beitrag wirklich löschen?")) return;
    clearMessages();
    try {
      await adminApi.deletePost(slug);
      setPost(blankPost());
      setSection("stories");
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }, [clearMessages, refresh, setPost, setSection]);

  const uploadHero = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    clearMessages();
    setStatus("Bild wird direkt zu Vercel Blob hochgeladen …");
    try {
      const blob = await upload(`blog/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
        multipart: true,
        onUploadProgress: (progress) => setStatus(`Bild wird hochgeladen – ${Math.round(progress.percentage)}%`),
      });
      setPost((value) => ({ ...value, image: blob.url }));
      setStatus("Bild hochgeladen – jetzt speichern.");
    } catch (err) {
      setStatus("");
      setError(err.message || "Bild-Upload fehlgeschlagen.");
    }
  }, [clearMessages, setPost]);

  const uploadGallery = useCallback(async (files) => {
    if (!files.length || !gallery) return;
    setGalleryFiles(files);
    clearMessages();
    let done = 0;
    const failures = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      try {
        const blob = await upload(`gallery/${gallery}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/blob-upload",
          multipart: true,
          onUploadProgress: (progress) => setStatus(`${index + 1} / ${files.length}: ${file.name} – ${Math.round(progress.percentage)}%`),
        });
        setStatus(`${index + 1} / ${files.length}: ${file.name} wird registriert …`);
        await adminApi.galleryAction({ action: "image-register", slug: gallery, url: blob.url, filename: blob.pathname, storage: "blob" });
        done += 1;
      } catch (err) {
        failures.push(`${file.name}: ${err.message}`);
      }
    }
    setGalleryFiles([]);
    await refresh();
    if (failures.length) {
      setError(`${done} von ${files.length} Bildern hinzugefügt.\n${failures.join("\n")}`);
      setStatus(done ? `${done} Galeriebild(er) hinzugefügt.` : "");
    } else {
      setStatus(`${done} Galeriebild(er) erfolgreich hinzugefügt.`);
    }
  }, [clearMessages, gallery, refresh]);

  const galleryAction = useCallback(async (body) => {
    clearMessages();
    try {
      const result = await adminApi.galleryAction(body);
      if (body.action === "country-update" && result.slug) setGallery(result.slug);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }, [clearMessages, refresh, setGallery]);

  const saveAbout = useCallback(async (event, about) => {
    event.preventDefault();
    clearMessages();
    setStatus("About wird gespeichert …");
    try {
      await adminApi.saveAbout(about);
      setStatus("About gespeichert.");
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }, [clearMessages]);

  return {
    galleryFiles,
    error,
    status,
    clearMessages,
    refresh,
    logout,
    savePost,
    deletePost,
    uploadHero,
    uploadGallery,
    galleryAction,
    saveAbout,
  };
}
