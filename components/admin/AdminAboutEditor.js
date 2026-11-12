"use client";

import { useState } from "react";
import { createBlogUploadPath, uploadAdminBlob } from "../../lib/admin-upload";

export default function AdminAboutEditor({ about, status, error, onChange, onSave }) {
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  if (!about) return null;

  const images = Array.isArray(about.images) ? about.images : [];

  async function addImages(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setUploadError("");
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setUploadError(`${file.name}: Bitte nur Bilddateien auswählen.`);
        continue;
      }
      try {
        setUploadStatus(`${file.name} wird hochgeladen …`);
        const blob = await uploadAdminBlob(createBlogUploadPath(file), file, (progress) => {
          setUploadStatus(`${file.name}: ${Math.round(progress.percentage)}%`);
        });
        onChange("en", "images", [...images, { url: blob.url, caption: "", alt: file.name.replace(/\\.[^.]+$/, "") }]);
      } catch (err) {
        setUploadError(err?.message || `${file.name}: Upload fehlgeschlagen.`);
      }
    }
    setUploadStatus("");
  }

  function updateImage(index, field, value) {
    onChange("en", "images", images.map((image, i) => i === index ? { ...image, [field]: value } : image));
  }

  return (
    <section className="editor">
      <div className="editor-head"><div><p className="admin-eyebrow">About me</p><h1>Über mich bearbeiten</h1></div></div>
      <form onSubmit={onSave} className="editor-form">
        <div className="about-admin-block">
          <h2>BILDER</h2>
          <p className="admin-help">Bilder werden dauerhaft in Vercel Blob gespeichert und erscheinen auf der About-Seite in einer eigenen Fotogalerie.</p>
          <label className="block-upload">＋ Bilder hochladen<input type="file" accept="image/*" multiple onChange={addImages} /></label>
          {uploadStatus && <p className="status">{uploadStatus}</p>}
          {uploadError && <p className="admin-error">{uploadError}</p>}
          {images.length > 0 && <div className="about-admin-images">
            {images.map((image, index) => (
              <div className="about-admin-image" key={image.url || index}>
                <img src={image.url} alt={image.alt || "About Foto"} />
                <label>Bildbeschreibung<input value={image.alt || ""} onChange={(e) => updateImage(index, "alt", e.target.value)} /></label>
                <label>Bildunterschrift<input value={image.caption || ""} onChange={(e) => updateImage(index, "caption", e.target.value)} /></label>
                <button type="button" className="about-image-remove" onClick={() => onChange("en", "images", images.filter((_, i) => i !== index))}>Bild entfernen</button>
              </div>
            ))}
          </div>}
        </div>
        {["en", "de"].map((language) => (
          <div key={language} className="about-admin-block">
            <h2>{language.toUpperCase()}</h2>
            <label>Kleine Überschrift<input value={about[language]?.eyebrow || ""} onChange={(e) => onChange(language, "eyebrow", e.target.value)} /></label>
            <label>Headline<input value={about[language]?.title || ""} onChange={(e) => onChange(language, "title", e.target.value)} /></label>
            {[0, 1, 2].map((index) => <label key={index}>Absatz {index + 1}<textarea value={about[language]?.paragraphs?.[index] || ""} onChange={(e) => onChange(language, "paragraphs", e.target.value, index)} /></label>)}
          </div>
        ))}
        <div className="save-row"><button className="save">About speichern →</button>{status && <span className="status">{status}</span>}</div>
        {error && <p className="admin-error">{error}</p>}
      </form>
    </section>
  );
}
