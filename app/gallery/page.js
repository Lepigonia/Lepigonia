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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const closeButton = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/gallery", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Gallery request failed");
        return response.json();
      })
      .then(data => {
        if (cancelled) return;
        const nextCountries = data.countries || [];
        setCountries(nextCountries);
        setError(false);
        const requested = new URLSearchParams(window.location.search).get("country");
        if (requested && nextCountries.some(country => country.slug === requested)) setSelected(requested);
      })
      .catch(() => {
        if (!cancelled) {
          setCountries([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
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
    const url = new URL(window.location.href);
    url.searchParams.set("country", slug);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeCountry() {
    setSelected(null);
    setLightbox(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("country");
    window.history.replaceState(null, "", url);
  }

  return <>
    <Navbar />
    <main className="gallery-page section-wrap page-top">
      <header className="gallery-hero">
        <p className="eyebrow"><T en="The gallery" de="Die Galerie" /></p>
        <h1><T en={<>Places I've <em>remembered.</em></>} de={<>Orte, die ich <em>erinnere.</em></>} /></h1>
        <p><T en="Photographs from the stories, the roads between them, and the moments worth keeping." de="Fotografien aus den Geschichten, den Wegen dazwischen und den Momenten, die bleiben." /></p>
        {!loading && countries.length > 0 && <div className="gallery-stats"><span>{countries.length} {countries.length === 1 ? <T en="country" de="Land" /> : <T en="countries" de="Länder" />}</span><span>{countries.reduce((n, c) => n + (c.images?.length || 0), 0)} <T en="photos" de="Fotos" /></span></div>}
      </header>

      {country ? <section className="country-view" aria-label={`${country.name} gallery`}>
        <button className="gallery-back" type="button" onClick={closeCountry}>← <T en="All countries" de="Alle Länder" /></button>
        <div className="country-heading">
          <div><p className="eyebrow">{images.length} <T en="photos" de="Fotos" /></p><h2>{country.name}</h2></div>
          <p className="gallery-keyline"><T en="A visual chapter from the road." de="Ein visuelles Kapitel unterwegs." /></p>
        </div>
        {images.length ? <div className="gallery-grid">{images.map((image, i) => <figure key={image.id} className={`gallery-image gallery-image--${i % 5}`}>
          <button className="gallery-image-button" type="button" onClick={() => setLightbox(image)} aria-label={`${i + 1} / ${images.length}`}>
            <Image src={image.url} alt={image.title || `${country.name} travel photo`} fill sizes="(max-width:700px) 50vw, (max-width:1100px) 33vw, 25vw" priority={i < 3} />
            <span className="gallery-hover"><T en="View photo" de="Foto ansehen" /> <b>↗</b></span>
          </button>
          {image.source === "blog" && image.postSlug && <Link href={`/blog/${image.postSlug}`} className="gallery-source"><T en="Story" de="Geschichte" /> →</Link>}
        </figure>)}</div> : <div className="gallery-empty"><p><T en="No photographs yet." de="Noch keine Fotos." /></p><span><T en="Add the first one from the admin area." de="Füge das erste Foto im Admin-Bereich hinzu." /></span></div>}
      </section> : <section className="country-grid" aria-label="Countries">
        {loading ? <div className="gallery-empty"><p><T en="Loading the gallery…" de="Galerie wird geladen …" /></p></div> : error ? <div className="gallery-empty"><p><T en="The gallery could not be loaded." de="Die Galerie konnte nicht geladen werden." /></p><span><T en="Please try again in a moment." de="Bitte versuche es gleich noch einmal." /></span></div> : countries.map((c, index) => <button key={c.slug} className={`country-card country-card--${index % 3}`} type="button" onClick={() => openCountry(c.slug)}>
          {c.images?.[0] && <Image src={c.images[0].url} alt={c.name} fill sizes="(max-width:700px) 100vw, (max-width:1000px) 50vw, 33vw" priority={index < 2} />}
          <span><strong>{c.name}</strong><small>{c.images?.length || 0} <T en="photos" de="Fotos" /></small></span><i aria-hidden="true">↗</i>
        </button>)}
        {!loading && !error && !countries.length && <div className="gallery-empty"><p><T en="No countries yet." de="Noch keine Länder." /></p><span><T en="Travel first. The gallery will follow." de="Reise zuerst. Die Galerie folgt." /></span></div>}
      </section>}
    </main>

    {lightbox && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onMouseDown={e => { if (e.target === e.currentTarget) setLightbox(null); }}>
      <button ref={closeButton} className="lightbox-close" type="button" onClick={() => setLightbox(null)} aria-label="Close photo viewer">×</button>
      <button className="lightbox-arrow lightbox-arrow--left" type="button" onClick={() => setLightbox(images[(currentIndex - 1 + images.length) % images.length])} aria-label="Previous photo">←</button>
      <div className="lightbox-frame"><div className="lightbox-image"><Image src={lightbox.url} alt={lightbox.title || `${country?.name || "Travel"} photo`} fill sizes="100vw" priority /></div><div className="lightbox-caption"><span>{country?.name}</span><small>{currentIndex + 1} / {images.length}</small>{lightbox.postSlug && <Link href={`/blog/${lightbox.postSlug}`}><T en="Read the story" de="Geschichte lesen" /> →</Link>}</div></div>
      <button className="lightbox-arrow lightbox-arrow--right" type="button" onClick={() => setLightbox(images[(currentIndex + 1) % images.length])} aria-label="Next photo">→</button>
    </div>}
    <Footer />
  </>;
}
