"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navItems = [["Stories","Geschichten","/blog"],["Travelmap","Reisekarte","/map"],["Gallery","Galerie","/gallery"],["About me","Über mich","/about"]];

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
  return <div className="language-switch" aria-label="Language">
    <button type="button" className={language === "DE" ? "active" : ""} onClick={() => change("DE")}>DE</button>
    <span>/</span>
    <button type="button" className={language === "EN" ? "active" : ""} onClick={() => change("EN")}>EN</button>
  </div>;
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
    const onKey = event => { if (event.key === "Escape") setOpen(false); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const login = <Link href="/login" onClick={() => setOpen(false)}><T en="Login" de="Anmelden" /></Link>;
  return <>
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`} style={{ color: "var(--ink)" }}>
      <div className="nav-shell">
        <Link href="/" className="wordmark" onClick={() => setOpen(false)}>Lepigonia</Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map(([en, de, href]) => <Link key={href} href={href}><T en={en} de={de} /></Link>)}
          <a href="/#newsletter"><T en="Newsletter" de="Newsletter" /></a>
          {login}
          <LanguageSwitch />
        </nav>
        <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(v => !v)}>
          <span /><span /><span className="sr-only"><T en="Menu" de="Menü" /></span>
        </button>
      </div>
      <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
        {navItems.map(([en, de, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}><T en={en} de={de} /></Link>)}
        <a href="/#newsletter" onClick={() => setOpen(false)}><T en="Newsletter" de="Newsletter" /></a>
        {login}
        <LanguageSwitch />
      </div>
    </header>
    <NewsletterModal />
  </>;
}

export function Footer() {
  return <footer className="site-footer">
    <div><Link href="/" className="wordmark">Lepigonia</Link><p><T en="Personal stories, places, food and moments from the road." de="Persönliche Geschichten, Orte, Essen und Momente unterwegs." /></p></div>
    <div className="footer-links">{navItems.map(([en, de, href]) => <Link key={href} href={href}><T en={en} de={de} /></Link>)}<Link href="/login"><T en="Login" de="Anmelden" /></Link><Link href="/privacy"><T en="Privacy" de="Datenschutz" /></Link>
      <div className="footer-socials" aria-label="Social media">
        <a className="footer-social-icon" href="https://www.instagram.com/Lepigonia" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
        <a className="footer-social-icon" href="https://www.youtube.com/@Lepigonia" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 7.2a2.7 2.7 0 0 0-1.9-1.9C17.4 4.8 12 4.8 12 4.8s-5.4 0-7.1.5A2.7 2.7 0 0 0 3 7.2 28 28 0 0 0 2.5 12a28 28 0 0 0 .5 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.1.5 7.1.5s5.4 0 7.1-.5a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .5-4.8 28 28 0 0 0-.5-4.8Z" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="m10 9 5 3-5 3z" fill="currentColor"/></svg></a>
        <a className="footer-social-icon" href="https://www.patreon.com/c/Lepigonia" target="_blank" rel="noopener noreferrer" aria-label="Patreon" title="Patreon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3v18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><circle cx="15" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg></a>
      </div>
    </div>
    <div className="footer-note"><T en="Until the next adventure." de="Bis zum nächsten Abenteuer." /></div>
  </footer>;
}

export function NewsletterModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#newsletter") setVisible(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    const isHome = window.location.pathname === "/";
    if (isHome && !localStorage.getItem("lepigonia-newsletter-seen") && window.location.hash !== "#newsletter") {
      const timer = setTimeout(() => setVisible(true), 3200);
      return () => { clearTimeout(timer); window.removeEventListener("hashchange", openFromHash); };
    }
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = event => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [visible]);

  function close() {
    localStorage.setItem("lepigonia-newsletter-seen", "1");
    setVisible(false);
    if (window.location.hash === "#newsletter") window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }

  async function submit(e) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, consent, website, source: window.location.hash === "#newsletter" ? "newsletter-link" : "popup" }) });
      if (!response.ok) throw new Error("Signup failed");
      setStatus("success");
      localStorage.setItem("lepigonia-newsletter-seen", "1");
    } catch {
      setStatus("error");
    }
  }

  if (!visible) return null;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="newsletter-title" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
    <div className="newsletter-modal">
      <button className="modal-close" type="button" onClick={close} aria-label="Close">×</button>
      {status === "success" ? <>
        <p className="eyebrow"><T en="Thank you" de="Danke" /></p>
        <h2 id="newsletter-title"><T en="You’re on the list ✨" de="Deine Anmeldung ist gespeichert ✨" /></h2>
        <p><T en="Thank you. Your email address has been saved for the Lepigonia newsletter. No emails are being sent yet." de="Danke. Deine E-Mail-Adresse wurde für den Lepigonia-Newsletter gespeichert. Aktuell werden noch keine E-Mails verschickt." /></p>
      </> : <>
        <p className="eyebrow"><T en="A note from the road" de="Eine Nachricht von unterwegs" /></p>
        <h2 id="newsletter-title"><T en="Come along for the journey." de="Komm mit auf die Reise." /></h2>
        <p><T en="New stories, special places and little travel inspirations, delivered straight to your inbox." de="Neue Geschichten, besondere Orte und kleine Reiseinspirationen direkt in dein Postfach." /></p>
        <form onSubmit={submit} className="newsletter-form">
          <label className="sr-only" htmlFor="newsletter-email"><T en="Email address" de="E-Mail-Adresse" /></label>
          <input id="newsletter-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" />
          <label className="newsletter-honeypot" aria-hidden="true">Website<input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label>
          <label className="newsletter-consent"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /><span><T en={<>I agree to receive the Lepigonia newsletter by email. My email address and consent are stored for this purpose. I can withdraw my consent at any time. See the <Link href="/privacy">privacy notice</Link>.</>} de={<>Ich möchte den Lepigonia-Newsletter per E-Mail erhalten. Meine E-Mail-Adresse und meine Einwilligung werden dafür gespeichert. Ich kann meine Einwilligung jederzeit widerrufen. Weitere Informationen in den <Link href="/privacy">Datenschutzhinweisen</Link>.</>} /></span></label>
          <button type="submit" disabled={status === "loading" || !consent}>{status === "loading" ? <T en="Joining…" de="Wird eingetragen …" /> : <T en="Join the journey →" de="Mitreisen →" />}</button>
        </form>
        {status === "error" && <p className="form-error"><T en="Your signup could not be saved right now. Please try again later." de="Die Anmeldung konnte gerade nicht gespeichert werden. Bitte versuche es später erneut." /></p>}
        <small><T en="Your address is stored for this newsletter list. No newsletter emails are sent yet." de="Deine Adresse wird für diese Newsletter-Liste gespeichert. Es werden noch keine Newsletter-E-Mails versendet." /></small>
      </>}
    </div>
  </div>;
}

export function Reveal({ children, className = "" }) { return <div className={`reveal ${className}`}>{children}</div>; }
