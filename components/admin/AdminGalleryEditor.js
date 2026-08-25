"use client";

export default function AdminGalleryEditor({ country, files, status, error, onFiles, onAction }) {
  if (!country) return <section className="editor"><div className="editor-head"><div><p className="admin-eyebrow">Galerie</p><h1>Galerie</h1><p>Wähle links ein Land aus.</p></div></div></section>;

  return (
    <section className="editor">
      <div className="editor-head"><div><p className="admin-eyebrow">Galerie</p><h1>{country.name}</h1><p>Blogbilder erscheinen automatisch. Zusätzliche Fotos kannst du hier unabhängig hochladen.</p></div></div>
      <label className="upload gallery-upload">＋ Mehrere Bilder hinzufügen<input type="file" accept="image/*" multiple onChange={(e) => { const selected = [...(e.target.files || [])]; e.target.value = ""; onFiles(selected); }} /></label>
      <p className="upload-hint">{files.length ? `${files.length} Bilder ausgewählt – Upload läuft …` : "Große iPhone/iPhoto-Originale werden direkt zu Vercel Blob hochgeladen."}</p>
      {status && <p className="status">{status}</p>}
      {error && <p className="admin-error" style={{ whiteSpace: "pre-line" }}>{error}</p>}
      <div className="story-grid">{country.images?.map((image) => <div className="story-card" key={image.id}><div className="story-media"><img src={image.url} alt={image.title || "Galeriebild"} /></div><div className="story-meta"><span>{image.source === "manual" ? "Manuell" : "Blogartikel"}</span>{image.source === "manual" && <button className="danger" type="button" onClick={() => { if (confirm("Bild wirklich löschen?")) onAction({ action: "image-delete", slug: country.slug, id: image.id }); }}>Löschen</button>}</div></div>)}</div>
      <hr />
      <div className="field-row gallery-settings">
        <label>Land umbenennen<input defaultValue={country.name} onBlur={(e) => { if (e.target.value !== country.name) onAction({ action: "country-update", slug: country.slug, name: e.target.value }); }} /></label>
        <button className="danger" type="button" onClick={() => { if (confirm(`Land ${country.name} löschen? Blogbilder bleiben erhalten.`)) onAction({ action: "country-delete", slug: country.slug }); }}>Land löschen</button>
      </div>
    </section>
  );
}
