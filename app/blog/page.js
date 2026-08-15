import Link from "next/link";
import Image from "next/image";
import { getPosts } from "../../lib/posts";
import { Navbar, Footer } from "../../components/SiteChrome";

export const metadata = { title: "Stories", description: "Travel stories from Lepigonia." };

export default function BlogPage() {
  const posts = getPosts();
  return <><Navbar /><main className="section-wrap page-top"><p className="eyebrow">The journal</p><h1 className="page-title">Stories from the road.</h1><p className="page-lead">Personal notes, places, food and moments that deserved more than a photograph.</p>{posts.length === 0 ? <div className="content-placeholder"><p className="eyebrow">Nothing published yet</p><h2>Make the first story.</h2><p>Add a Markdown file to <code>/posts</code>. Existing content remains the source of truth; this layout simply gives it a more considered stage.</p></div> : <div className="story-grid blog-grid">{posts.map(post => <Link className="story-card" href={`/blog/${post.slug}`} key={post.slug}><div className="story-media"><Image src={post.image || "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=80"} alt={post.title || "Travel story"} fill sizes="(max-width: 800px) 100vw, 45vw" /></div><div className="story-meta"><span>{post.location || "Journal"}</span><span>{post.date || ""}</span></div><h2>{post.title}</h2><p>{post.excerpt || "Read the story →"}</p></Link>)}</div>}</main><Footer /></>;
}
