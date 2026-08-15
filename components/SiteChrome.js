"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const links = [
  ["Stories", "/blog"],
  ["Destinations", "/map"],
  ["Gallery", "/gallery"],
  ["About", "/about"],
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <div className="nav-shell">
        <Link href="/" className="wordmark" onClick={() => setOpen(false)}>Lepigonia</Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <a href="#newsletter">Newsletter</a>
        </nav>
        <button className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(v => !v)}>
          <span /> <span />
          <span className="sr-only">Menu</span>
        </button>
      </div>
      <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`}>
        {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <a href="#newsletter" onClick={() => setOpen(false)}>Newsletter</a>
      </div>
    </header>
  );
}

export function Footer() {
  return <footer className="site-footer">
    <div><Link href="/" className="wordmark">Lepigonia</Link><p>Personal stories, places, food and moments from the road.</p></div>
    <div className="footer-links">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div>
    <div className="footer-note">Until the next adventure.</div>
  </footer>;
}

export function NewsletterModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (localStorage.getItem("lepigonia-newsletter-seen")) return;
    const timer = setTimeout(() => setVisible(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    localStorage.setItem("lepigonia-newsletter-seen", "1");
    setVisible(false);
  };

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      if (!response.ok) throw new Error("Signup failed");
      setStatus("success");
      localStorage.setItem("lepigonia-newsletter-seen", "1");
    } catch { setStatus("error"); }
  }

  if (!visible) return null;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="newsletter-title">
    <div className="newsletter-modal">
      <button className="modal-close" onClick={close} aria-label="Close">×</button>
      {status === "success" ? <><p className="eyebrow">Thank you</p><h2 id="newsletter-title">You’re on the list ✨</h2><p>New stories will find their way to you when there is something worth telling.</p></> : <>
        <p className="eyebrow">A note from the road</p><h2 id="newsletter-title">Come along for the journey.</h2>
        <p>Neue Geschichten, besondere Orte und kleine Reiseinspirationen direkt in dein Postfach.</p>
        <form onSubmit={submit} className="newsletter-form"><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" /><button disabled={status === "loading"}>{status === "loading" ? "Joining…" : "Join the journey →"}</button></form>
        {status === "error" && <p className="form-error">Something went wrong. Please try again.</p>}
        <small>Kein Spam. Nur Geschichten, wenn es etwas zu erzählen gibt.</small>
      </>}
    </div>
  </div>;
}

export function Reveal({ children, className = "" }) { return <div className={`reveal ${className}`}>{children}</div>; }
