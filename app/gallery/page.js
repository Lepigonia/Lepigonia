"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar, Footer, T } from "../../components/SiteChrome";
import "./gallery.css";

export default function GalleryPage() {
  const [countries, setCountries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const closeButton = useRef(null);

  useEffect(() => {
    fetch("/api/gallery", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setCountries(d.countries || []))
      .catch(() => setCountries([]));
  }, []);

  const country = countries.find(c => c.slug === selected);
  const images = country?.images || [];
  const currentIndex = lightbox ? images.findIndex(i => i.id === lightbox.id) : -1;

  useEffect(() => {
    if (!lightbox) return;
    closeButton.current?.focus();
    const onKey = e => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight" && images.length) setLightbox(images[(currentIndex + 1) % images.length]);
      if (e.key === "ArrowLeft" && images.length) setLightbox(images[(currentIndex - 1 + images.length) % images.length]);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, currentIndex, images]);

  function openCountry(slug) {
    setLightbox(null);
    setSelected(slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Navbar />
      <main className="gallery-page section-wrap page-top">
        <header className="gallery-hero">
          <p className="eyebrow">The gallery</p>
          <h1><T en={<>Places I've <em>remembered.</em></>} de={<>Orte, die ich <em>erinnere.</em></>} /></h1>
          <p>Photographs from the stories, the roads between them, and the moments worth keeping.</p>
          {countries.length > 0 && (
            <div className="gallery-stats">
              <span>{countries.length} {countries.length === 1 ? "country" : "countries"}</span>
              <span>{countries.reduce((n, c) => n + (c.images?.length || 0), 0)} photos</span>
            </div>
          )}
        </header>

        {country ? (
          <section className="country-view" aria-label={`${country.name} gallery`}>
            <button className="gallery-back" onClick={() => { setSelected(null); setLightbox(null); }}>
              ← <T en="All countries" de="Alle Länder" />
            </button>
            <div className="country-heading">
              <div>
                <p className="eyebrow">{images.length} photos</p>
                <h2>{country.name}</h2>
              </div>
              <p className="gallery-keyline">A visual chapter from the road.</p>
            </div>

            {images.length ? (
              <div className="gallery-grid">
                {images.map((image, i) => (
                  <figure key={image.id} className={`gallery-image gallery-image--${i % 5}`}>
                    <button className="gallery-image-button" onClick={() => setLightbox(image)} aria-label={`Open photo ${i + 1} of ${images.length}`}>
                      <Image src={image.url} alt={image.title || `${country.name} travel photo`} fill sizes="(max-width:700px) 50vw, (max-width:1100px) 33vw, 25vw" priority={i < 3} />
                      <span className="gallery-hover">View photo <b>↗</b></span>
                    </button>
                    {image.source === "blog" && image.postSlug && <Link href={`/blog/${image.postSlug}`} className="gallery-source">Story →</Link>}
                  </figure>
                ))}
              </div>
            ) : (
              <div className="gallery-empty"><p>No photographs yet.</p><span>Add the first one from the admin area.</span></div>
            )}
          </section>
        ) : (
          <section className="country-grid" aria-label="Countries">
            {countries.map((c, index) => (
              <button key={c.slug} className={`country-card country-card--${index % 3}`} onClick={() => openCountry(c.slug)}>
                {c.images?.[0] && <Image src={c.images[0].url} alt={c.name} fill sizes="(max-width:700px) 100vw, (max-width:1000px) 50vw, 33vw" priority={index < 2} />}
                <span><strong>{c.name}</strong><small>{c.images?.length || 0} photos</small></span>
                <i aria-hidden="true">↗</i>
              </button>
            ))}
            {!countries.length && <div className="gallery-empty"><p>No countries yet.</p><span>Travel first. The gallery will follow.</span></div>}
          </section>
        )}
      </main>

      {lightbox && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onMouseDown={e => { if (e.target === e.currentTarget) setLightbox(null); }}>
          <button ref={closeButton} className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close photo viewer">×</button>
          <button className="lightbox-arrow lightbox-arrow--left" onClick={() => setLightbox(images[(currentIndex - 1 + images.length) % images.length])} aria-label="Previous photo">←</button>
          <div className="lightbox-frame">
            <div className="lightbox-image"><Image src={lightbox.url} alt={lightbox.title || `${country?.name || "Travel"} photo`} fill sizes="100vw" priority /></div>
            <div className="lightbox-caption">
              <span>{country?.name}</span>
              <small>{currentIndex + 1} / {images.length}</small>
              {lightbox.postSlug && <Link href={`/blog/${lightbox.postSlug}`}>Read the story →</Link>}
            </div>
          </div>
          <button className="lightbox-arrow lightbox-arrow--right" onClick={() => setLightbox(images[(currentIndex + 1) % images.length])} aria-label="Next photo">→</button>
        </div>
      )}
      <Footer />
    </>
  );
}
