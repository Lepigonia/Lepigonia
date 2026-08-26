import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import Image from "next/image";
import { getPost, getPosts } from "../../../lib/posts";
import { Navbar, Footer, T } from "../../../components/SiteChrome";
import "../blog-blocks.css";

export function generateStaticParams() { return getPosts().map(post => ({ slug: post.slug })); }
function readingTime(content = "") { const words = content.replace(/[#*_`>\[\]()]/g, " ").trim().split(/\s+/).filter(Boolean).length; return Math.max(1, Math.ceil(words / 220)); }
function firstParagraph(content = "") { const match = content.match(/^(?:\s*#.*\n+|\s*)?([^\n]+(?:\n(?!#|\n)[^\n]+)*)/); return match?.[1]?.replace(/[*_`]/g, "").trim() || ""; }
export async function generateMetadata({ params }) { const post = getPost(params.slug); return post ? { title: post.title, description: post.excerpt || `A travel story from ${post.location || "the road"}.` } : {}; }

export default function PostPage({ params }) {
  const post = getPost(params.slug);
  if (!post) notFound();
  const html = marked.parse(post.content || "");
  const minutes = readingTime(post.content);
  const lead = post.excerpt || firstParagraph(post.content);
  const hasCoordinates = post.lat !== undefined && post.lat !== "" && post.lng !== undefined && post.lng !== "";
  const kickerValues = [post.country, post.location, post.date].filter(Boolean).filter((value, index, values) => values.findIndex(item => item.toLowerCase() === value.toLowerCase()) === index);

  return <>
    <Navbar />
    <main className="article">
      <header className="article-header">
        <div className="article-kicker">{kickerValues.map((value, index) => <span key={`${value}-${index}`}>{index ? "· " : ""}{value}</span>)}</div>
        <h1>{post.title}</h1>
        {lead && <p className="article-dek">{lead}</p>}
        <div className="article-meta-row">
          <span>{minutes} <T en="min read" de="Min. Lesezeit" /></span>
          {hasCoordinates && <Link href={`/map?lat=${encodeURIComponent(post.lat)}&lng=${encodeURIComponent(post.lng)}&slug=${encodeURIComponent(post.slug)}`}><T en="View this place on the map" de="Diesen Ort auf der Karte ansehen" /> ↗</Link>}
        </div>
      </header>
      {post.image && <figure className="article-hero"><Image src={post.image} alt={post.title} fill priority sizes="100vw" /><figcaption>{post.location || post.country || "On the road"}</figcaption></figure>}
      <div className="article-layout">
        <aside className="article-aside">
          <span className="article-aside-label"><T en="This chapter" de="Dieses Kapitel" /></span>
          <strong>{post.country || <T en="The road" de="Die Reise" />}</strong>
          {post.location && post.location.toLowerCase() !== String(post.country || "").toLowerCase() && <span>{post.location}</span>}
          <span>{minutes} <T en="min read" de="Min. Lesezeit" /></span>
        </aside>
        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <footer className="article-end">
        <p className="eyebrow"><T en="Keep wandering" de="Weiterziehen" /></p>
        <h2><T en="There is always another road." de="Es gibt immer eine nächste Straße." /></h2>
        <div className="article-end-links">
          <Link href="/gallery" className="editorial-link"><T en="Explore the photographs" de="Fotografien entdecken" /> <span>→</span></Link>
          {post.country && <Link href={`/gallery?country=${encodeURIComponent(post.country.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))}`} className="editorial-link"><T en={<>See {post.country}</>} de={<> {post.country} ansehen</>} /> <span>→</span></Link>}
        </div>
      </footer>
    </main>
    <Footer />
  </>;
}
