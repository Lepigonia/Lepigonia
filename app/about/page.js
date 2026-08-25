"use client";
import { useEffect, useState } from "react";
import { Navbar, Footer } from "../../components/SiteChrome";

export const metadata = { title: "About", description: "The person and stories behind Lepigonia." };

export default function AboutPage() {
  const [about, setAbout] = useState(null);
  useEffect(() => { fetch("/api/about", { cache: "no-store" }).then(r => r.json()).then(setAbout).catch(() => {}); }, []);
  const lang = typeof window !== "undefined" && localStorage.getItem("lepigonia-language") === "DE" ? "de" : "en";
  const copy = about?.[lang];
  return <><Navbar/><main className="section-wrap page-top about-page"><div><p className="eyebrow">{copy?.eyebrow || "Behind the journal"}</p><h1 className="page-title">{copy?.title || "A real person. A life in motion."}</h1></div><div className="about-copy">{(copy?.paragraphs || []).map((p, i) => <p key={i} className={i === 2 ? "muted" : ""}>{p}</p>)}</div></main><Footer/></>;
}
