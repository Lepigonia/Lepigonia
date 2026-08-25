"use client";

import Link from "next/link";

export default function AdminSidebar({ posts, countries, postSlug, gallery, section, onNewStory, onSelectStory, onNewCountry, onSelectCountry, onAbout }) {
  return (
    <aside className="admin-sidebar">
      <button className="new-button" onClick={onNewStory}>＋ Neue Geschichte</button>
      <b>Stories</b>
      {posts.map((post) => (
        <button key={post.slug} className={`post-nav ${postSlug === post.slug && section === "stories" ? "active" : ""}`} onClick={() => onSelectStory(post)}>
          <strong>{post.title || post.slug}</strong>
          <small>{post.country || post.location || "Ohne Land"}</small>
        </button>
      ))}
      <hr />
      <b>Galerie</b>
      <button className="new-button" onClick={onNewCountry}>＋ Neues Land</button>
      {countries.map((country) => (
        <button key={country.slug} className={`post-nav ${gallery === country.slug && section === "gallery" ? "active" : ""}`} onClick={() => onSelectCountry(country)}>
          <strong>{country.name}</strong>
          <small>{country.images?.length || 0} Bilder</small>
        </button>
      ))}
      <hr />
      <button className={`post-nav ${section === "about" ? "active" : ""}`} onClick={onAbout}>
        <strong>About me</strong>
        <small>Persönliche Seite bearbeiten</small>
      </button>
      <div className="admin-sidebar-links">
        <Link href="/gallery" target="_blank">Galerie ↗</Link>
        <Link href="/map" target="_blank">Karte ↗</Link>
        <Link href="/" target="_blank">Website ↗</Link>
      </div>
    </aside>
  );
}
