"use client";

import BlogBlockEditor from "../BlogBlockEditor";

export default function AdminStoryEditor({ post, countries, status, error, onChange, onSave, onDelete, onHeroUpload }) {
  const set = (key, value) => onChange({ ...post, [key]: value });
  const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");

  return (
    <section className="editor">
      <div className="editor-head"><div><p className="admin-eyebrow">Editor 2.0</p><h1>{post.slug ? "Geschichte bearbeiten" : "Neue Geschichte"}</h1></div>{post.slug && <button className="danger" type="button" onClick={onDelete}>Löschen</button>}</div>
      <form onSubmit={onSave} className="editor-form">
        <div className="field-row">
          <label>Titel<input value={post.title} onChange={(e) => set("title", e.target.value)} required /></label>
          <label>Slug<input value={post.slug} onChange={(e) => set("slug", slugify(e.target.value))} required /></label>
        </div>
        <div className="field-row">
          <label>Datum<input type="date" value={post.date} onChange={(e) => set("date", e.target.value)} /></label>
          <label>Ort<input value={post.location} onChange={(e) => set("location", e.target.value)} /></label>
        </div>
        <label>Land<select value={post.country} onChange={(e) => set("country", e.target.value)}><option value="">Land wählen</option>{countries.map((country) => <option key={country.slug} value={country.name}>{country.name}</option>)}</select></label>
        <div className="field-row">
          <label>Breitengrad (Lat)<input type="number" step="any" min="-90" max="90" value={post.lat || ""} onChange={(e) => set("lat", e.target.value)} /></label>
          <label>Längengrad (Long)<input type="number" step="any" min="-180" max="180" value={post.lng || ""} onChange={(e) => set("lng", e.target.value)} /></label>
        </div>
        <label>Teaser<input value={post.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></label>
        <label>Hero-Bild-URL<input value={post.image} onChange={(e) => set("image", e.target.value)} /></label>
        <label className="upload">Hero-Bild hochladen<input type="file" accept="image/*" onChange={onHeroUpload} /></label>
        <p className="upload-hint">Das Hero-Bild wird direkt in Vercel Blob gespeichert. Bilder im Text können separat eingefügt werden.</p>
        <BlogBlockEditor value={post.content} onChange={(content) => set("content", content)} country={post.country} />
        <div className="save-row"><button className="save">Speichern & veröffentlichen →</button>{status && <span className="status">{status}</span>}</div>
        {error && <p className="admin-error" style={{ whiteSpace: "pre-line" }}>{error}</p>}
      </form>
    </section>
  );
}
