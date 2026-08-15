import Image from "next/image";
import Link from "next/link";
import { getPosts } from "../lib/posts";
import { Navbar, Footer, NewsletterModal, Reveal } from "../components/SiteChrome";

export default function Home() {
  const posts = getPosts();
  const featured = posts[0];
  const rest = posts.slice(1, 5);
  return <>
    <Navbar />
    <main>
      <section className="hero">
        <div className="hero-image" aria-hidden="true">
          <Image src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=85" alt="Atmospheric mountain landscape" fill priority sizes="100vw" />
        </div>
        <div className="hero-scrim" />
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">Personal travel journal</p>
          <h1>Stories from places<br /><em>worth remembering.</em></h1>
          <p className="hero-copy">Slow travel, beautiful photography and the little moments that stay with you.</p>
          <Link href="#stories" className="editorial-link light">Explore stories <span>→</span></Link>
        </div>
        <div className="hero-scroll">Scroll to wander <span>↓</span></div>
      </section>

      <section className="intro section-wrap">
        <Reveal><p className="eyebrow">The journal</p><h2>Travel slowly.<br /><em>Notice everything.</em></h2></Reveal>
        <Reveal className="intro-copy"><p>Lepigonia is a personal collection of journeys, places, food and fleeting moments from the road. Less itinerary, more memory.</p><Link href="/about" className="editorial-link">A little about me <span>→</span></Link></Reveal>
      </section>

      <section id="stories" className="stories section-wrap">
        <Reveal><div className="section-heading"><div><p className="eyebrow">Recent stories</p><h2>From the road</h2></div><Link href="/blog" className="editorial-link">All stories <span>→</span></Link></div></Reveal>
        {featured ? <Reveal className="featured-story"><Link href={`/blog/${featured.slug}`}><div className="story-media"><Image src={featured.image || "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=80"} alt={featured.title || "Travel story"} fill sizes="(max-width: 800px) 100vw, 90vw" /></div><div className="story-meta"><span>{featured.location || "Journal"}</span><span>{featured.date || ""}</span></div><h3>{featured.title}</h3><p>{featured.excerpt || "A story from the road."}</p></Link></Reveal> : <div className="content-placeholder"><p className="eyebrow">Stories coming soon</p><h3>Your next journey belongs here.</h3><p>Add a Markdown story to <code>/posts</code> and it will appear automatically.</p></div>}
        {rest.length > 0 && <div className="story-grid">{rest.map((post, i) => <Reveal key={post.slug} className={`story-card ${i % 3 === 0 ? "story-card--wide" : ""}`}><Link href={`/blog/${post.slug}`}><div className="story-media"><Image src={post.image || "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=80"} alt={post.title || "Travel story"} fill sizes="(max-width: 800px) 100vw, 45vw" /></div><div className="story-meta"><span>{post.location || "Journal"}</span><span>{post.date || ""}</span></div><h3>{post.title}</h3></Link></Reveal>)}</div>}
      </section>

      <section className="statement"><div><p className="eyebrow">Why Lepigonia</p><p className="statement-text">“Some places are beautiful.<br /><em>Others become part of you.</em>”</p></div></section>

      <section id="newsletter" className="newsletter-strip section-wrap"><Reveal><p className="eyebrow">Stay close</p><h2>Stories, when there’s<br /><em>something to tell.</em></h2><a href="#newsletter" className="editorial-link">Join the journey <span>→</span></a></Reveal></section>
    </main>
    <Footer /><NewsletterModal />
  </>;
}
