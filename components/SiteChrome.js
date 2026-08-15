"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navItems = [
  ["Stories", "Geschichten", "/blog"],
  ["Travelmap", "Reisekarte", "/map"],
  ["Gallery", "Galerie", "/gallery"],
  ["About me", "Über mich", "/about"],
];

export function T({ en, de, className = "" }) {
  const [language, setLanguage] = useState("EN");
  useEffect(() => {
    const sync = () => setLanguage(localStorage.getItem("lepigonia-language") === "DE" ? "DE" : "EN");
    sync();
    window.addEventListener("lepigonia-language", sync);
    return () => window.removeEventListener("lepigonia-language", sync);
  }, []);
  return <span className={className}>{language === "DE" ? de : en}</span>;
}

function LanguageSwitch() {
  const [language, setLanguage] = useState("EN");
  useEffect(() => {
    const saved = localStorage.getItem("lepigonia-language");
    if (saved === "DE" || saved === "EN") setLanguage(saved);
  }, []);
  function change(next) {
    setLanguage(next);
    localStorage.setItem("lepigonia-language", next);
    document.documentElement.lang = next.toLowerCase();
    document.documentElement.dataset.language = next;
    window.dispatchEvent(new Event("lepigonia-language"));
  }
  return <div className="language-switch" aria-label="Language"><button type="button" className={language === "DE" ? "active" : ""} onClick={() => change("DE")}>DE</button><span>/</span><button type="button" className={language === "EN" ? "active" : ""} onClick={() => change("EN")}>EN</button></div>;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("lepigonia-language");
    const lang = saved === "DE" ? "DE" : "EN";
    document.documentElement.lang = lang.toLowerCase();
    document.documentElement.dataset.language = lang;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
    <div className="nav-shell">
      <Link href="/" className="wordmark" onClick={() => setOpen(false)}>Lepigonia</Link>
      <nav className="desktop-nav" aria-label="Primary navigation">{navItems.map(([en, de, href]) => <Link key={href} href={href}>{<T en={en} de={de} />}</Link>)}<a href="/#newsletter"><T en="Newsletter" de="Newsletter" /></a><LanguageSwitch /></nav>
      <button className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(v => !v)}><span /><span /><span className="sr-only">Menu</span></button>
    </div>
    <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`}>{navItems.map(([en, de, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}><T en={en} de={de} /></Link>)}<a href="/#newsletter" onClick={() => setOpen(false)}><T en="Newsletter" de="Newsletter" /></a><LanguageSwitch /></div>
  </header>;
}

export function Footer() { return <footer className="site-footer"><div><Link href="/" className="wordmark">Lepigonia</Link><p><T en="Personal stories, places, food and moments from the road." de="Persönliche Geschichten, Orte, Essen und Momente unterwegs." /></p></div><div className="footer-links">{navItems.map(([en, de, href]) => <Link key={href} href={href}><T en={en} de={de} /></Link>)}</div><div className="footer-note"><T en="Until the next adventure." de="Bis zum nächsten Abenteuer." /></div></footer>; }

export function NewsletterModal() {
  const [visible, setVisible] = useState(false); const [email, setEmail] = useState(""); const [status, setStatus] = useState("idle");
  useEffect(() => { if (localStorage.getItem("lepigonia-newsletter-seen")) return; const timer = setTimeout(() => setVisible(true), 3200); return () => clearTimeout(timer); }, []);
  const close = () => { localStorage.setItem("lepigonia-newsletter-seen", "1"); setVisible(false); };
  async function submit(e) { e.preventDefault(); setStatus("loading"); try { const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }); if (!response.ok) throw new Error("Signup failed"); setStatus("success"); localStorage.setItem("lepigonia-newsletter-seen", "1"); } catch { setStatus("error"); } }
  if (!visible) return null;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="newsletter-title"><div className="newsletter-modal"><button className="modal-close" onClick={close} aria-label="Close">×</button>{status === "success" ? <><p className="eyebrow"><T en="Thank you" de="Danke" /></p><h2 id="newsletter-title"><T en="You’re on the list ✨" de="Du bist dabei ✨" /></h2><p><T en="New stories will find their way to you when there is something worth telling." de="Neue Geschichten erreichen dich, wenn es etwas zu erzählen gibt." /></p></> : <><p className="eyebrow"><T en="A note from the road" de="Eine Nachricht von unterwegs" /></p><h2 id="newsletter-title"><T en="Come along for the journey." de="Komm mit auf die Reise." /></h2><p><T en="New stories, special places and little travel inspirations, delivered straight to your inbox." de="Neue Geschichten, besondere Orte und kleine Reiseinspirationen direkt in dein Postfach." /></p><form onSubmit={submit} className="newsletter-form"><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" /><button disabled={status === "loading"}>{status === "loading" ? "Joining…" : "Join the journey →"}</button></form>{status === "error" && <p className="form-error"><T en="Something went wrong. Please try again." de="Etwas ist schiefgelaufen. Bitte versuche es erneut." /></p>}<small><T en="No spam. Just stories when there is something worth telling." de="Kein Spam. Nur Geschichten, wenn es etwas zu erzählen gibt." /></small></>}</div></div>;
}

export function Reveal({ children, className = "" }) { return <div className={`reveal ${className}`}>{children}</div>; }
