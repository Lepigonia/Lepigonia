import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import Image from "next/image";
import { getPost, getPosts } from "../../../lib/posts";
import { Navbar, Footer } from "../../../components/SiteChrome";
import "../blog-blocks.css";

export function generateStaticParams() { return getPosts().map(post => ({ slug: post.slug })); }
function readingTime(content = "") { const words = content.replace(/[#*_`>\[\]()]/g, " ").trim().split(/\s+/).filter(Boolean).length; return Math.max(1, Math.ceil(words / 220)); }
function firstParagraph(content = "") { const match = content.match(/^(?:\s*#.*\n+|\s*)?([^\n]+(?:\n(?!#|\n)[^\n]+)*)/); return match?.[1]?.replace(/[*_`]/g, "").trim() || ""; }
export async function generateMetadata({ params }) { const post = getPost(params.slug); return post ? { title: post.title, description: post.excerpt || `A travel story from ${post.location || "the road"}.` } : {}; }
export default function PostPage({ params }) {
  const post = getPost(params.slug); if (!post) notFound();
  const html = marked.parse(post.content || ""); const minutes = readingTime(post.content); const lead = post.excerpt || firstParagraph(post.content); const hasCoordinates = post.lat !== undefined && post.lat !== "" && post.lng !== undefined && post.lng !== "";
  return <><Navbar/><main className="article"><header className="article-header"><div className="article-kicker"><span>{post.country || "Travel journal"}</span>{post.location&&<span>· {post.location}</span>}{post.date&&<span>· {post.date}</span>}</div><h1>{post.title}</h1>{lead&&<p className="article-dek">{lead}</p>}<div className="article-meta-row"><span>{minutes} min read</span>{hasCoordinates&&<Link href={`/map?lat=${encodeURIComponent(post.lat)}&lng=${encodeURIComponent(post.lng)}&slug=${encodeURIComponent(post.slug)}`}>View this place on the map ↗</Link>}</div></header>{post.image&&<figure className="article-hero"><Image src={post.image} alt={post.title} fill priority sizes="100vw"/><figcaption>{post.location||post.country||"On the road"}</figcaption></figure>}<div className="article-layout"><aside className="article-aside"><span className="article-aside-label">This chapter</span><strong>{post.country||"The road"}</strong>{post.location&&<span>{post.location}</span>}<span>{minutes} min read</span></aside><article className="prose" dangerouslySetInnerHTML={{__html:html}}/></div><footer className="article-end"><p className="eyebrow">Keep wandering</p><h2>There is always another road.</h2><div className="article-end-links"><Link href="/gallery" className="editorial-link">Explore the photographs <span>→</span></Link>{post.country&&<Link href="/gallery" className="editorial-link">See {post.country} <span>→</span></Link>}</div></footer></main><Footer/></>;
}
