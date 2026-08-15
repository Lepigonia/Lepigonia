import { notFound } from "next/navigation";
import { marked } from "marked";
import Image from "next/image";
import { getPost, getPosts } from "../../../lib/posts";
import { Navbar, Footer } from "../../../components/SiteChrome";

export function generateStaticParams() { return getPosts().map(post => ({ slug: post.slug })); }

export async function generateMetadata({ params }) {
  const post = getPost(params.slug);
  return post ? { title: post.title, description: post.excerpt || `A travel story from ${post.location || "the road"}.` } : {};
}

export default function PostPage({ params }) {
  const post = getPost(params.slug);
  if (!post) notFound();
  const html = marked.parse(post.content || "");
  return <><Navbar /><main className="article"><header className="article-header"><p className="eyebrow">{post.location || "Travel journal"} {post.date ? `· ${post.date}` : ""}</p><h1>{post.title}</h1>{post.excerpt && <p>{post.excerpt}</p>}</header>{post.image && <div className="article-hero"><Image src={post.image} alt={post.title} fill priority sizes="100vw" /></div>}<article className="prose" dangerouslySetInnerHTML={{ __html: html }} /></main><Footer /></>;
}
