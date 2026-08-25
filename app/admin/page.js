"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import Link from "next/link";
import AdminAboutEditor from "../../components/admin/AdminAboutEditor";
import AdminGalleryEditor from "../../components/admin/AdminGalleryEditor";
import AdminLogin from "../../components/admin/AdminLogin";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminStoryEditor from "../../components/admin/AdminStoryEditor";
import { adminApi } from "../../lib/admin-api";
import { useAdminData } from "../../hooks/useAdminData";
import "./admin.css";

const blankPost = () => ({
  slug: "",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  country: "",
  lat: "",
  lng: "",
  image: "",
  excerpt: "",
  content: "",
});

export default function Admin() {
  const data = useAdminData();
  const [post, setPost] = useState(blankPost);
  const [section, setSection] = useState("stories");
  const [gallery, setGallery] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const currentCountry = data.countries.find((country) => country.slug === gallery);

  function clearMessages() {
    setError("");
    setStatus("");
  }

  async function refresh() {
    const result = await data.reload();
    if (!result) return;
    if (!gallery && result.countries[0]) setGallery(result.countries[0].slug);
  }

  async function logout() {
    await adminApi.logout();
    window.location.reload();
  }

  async function savePost(event) {
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
  }

  async function deletePost() {
    if (!confirm("Beitrag wirklich löschen?")) return;
    clearMessages();
    try {
      await adminApi.deletePost(post.slug);
      setPost(blankPost());
      setSection("stories");
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadHero(event) {
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
  }

  async function uploadGallery(files) {
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
  }

  async function galleryAction(body) {
    clearMessages();
    try {
      const result = await adminApi.galleryAction(body);
      if (body.action === "country-update" && result.slug) setGallery(result.slug);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveAbout(event) {
    event.preventDefault();
    clearMessages();
    setStatus("About wird gespeichert …");
    try {
      await adminApi.saveAbout(data.about);
      setStatus("About gespeichert.");
    } catch (err) {
      setError(err.message);
      setStatus("");
    }
  }

  function updateAbout(language, field, value, index) {
    data.setAbout((current) => {
      const localized = { ...(current[language] || {}) };
      if (field === "paragraphs") {
        const paragraphs = [...(localized.paragraphs || ["", "", ""])];
        paragraphs[index] = value;
        localized.paragraphs = paragraphs;
      } else {
        localized[field] = value;
      }
      return { ...current, [language]: localized };
    });
  }

  if (data.ready === null) return <div className="admin-loading">Lepigonia Admin …</div>;
  if (!data.ready) return <AdminLogin onSuccess={refresh} />;

  function newStory() {
    setSection("stories");
    setPost(blankPost());
    clearMessages();
  }

  function selectStory(value) {
    setSection("stories");
    setPost(value);
    clearMessages();
  }

  function selectCountry(country) {
    setSection("gallery");
    setGallery(country.slug);
    setPost(blankPost());
    clearMessages();
  }

  function newCountry() {
    const name = prompt("Neues Land:");
    if (name) galleryAction({ action: "country-create", name });
  }

  return (
    <main className="admin-shell">
      <header className="admin-top">
        <div><Link href="/" className="admin-brand">Lepigonia</Link><span className="admin-top-label"> / Admin</span></div>
        <nav className="admin-top-nav"><button onClick={logout}>Logout</button></nav>
      </header>
      <div className="admin-grid">
        <AdminSidebar
          posts={data.posts}
          countries={data.countries}
          postSlug={post.slug}
          gallery={gallery}
          section={section}
          onNewStory={newStory}
          onSelectStory={selectStory}
          onNewCountry={newCountry}
          onSelectCountry={selectCountry}
          onAbout={() => { setSection("about"); setPost(blankPost()); clearMessages(); }}
        />
        {section === "about" && (
          <AdminAboutEditor about={data.about} status={status} error={error} onChange={updateAbout} onSave={saveAbout} />
        )}
        {section === "stories" && (
          <AdminStoryEditor post={post} countries={data.countries} status={status} error={error} onChange={setPost} onSave={savePost} onDelete={deletePost} onHeroUpload={uploadHero} />
        )}
        {section === "gallery" && (
          <AdminGalleryEditor country={currentCountry} files={galleryFiles} status={status} error={error} onFiles={uploadGallery} onAction={galleryAction} />
        )}
      </div>
    </main>
  );
}
