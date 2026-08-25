"use client";

export default function AdminAboutEditor({ about, status, error, onChange, onSave }) {
  if (!about) return null;
  return (
    <section className="editor">
      <div className="editor-head"><div><p className="admin-eyebrow">About me</p><h1>Über mich bearbeiten</h1></div></div>
      <form onSubmit={onSave} className="editor-form">
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
