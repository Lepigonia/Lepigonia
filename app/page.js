import Image from "next/image";
import Link from "next/link";
import { getPosts } from "../lib/posts";
import { Navbar, Footer, Reveal, T } from "../components/SiteChrome";

export default function Home() {
  const posts = getPosts();
  const featured = posts[0];
  const rest = posts.slice(1, 5);
  return <>
    <Navbar />
    <main>
      <section className="hero">
        <div className="hero-image" aria-hidden="true"><Image src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=85" alt="Atmospheric mountain landscape" fill priority sizes="100vw" /></div>
        <div className="hero-scrim" />
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow"><T en="Personal travel journal" de="Persönliches Reisetagebuch" /></p>
          <h1><T en={<>Stories from places<br /><em>worth remembering.</em></>} de={<>Geschichten von Orten,<br /><em>die bleiben.</em></>} /></h1>
          <p className="hero-copy"><T en="Slow travel, beautiful photography and the little moments that stay with you." de="Langsames Reisen, besondere Fotografie und die kleinen Momente, die bleiben." /></p>
          <Link href="#stories" className="editorial-link light"><T en="Explore stories" de="Geschichten entdecken" /> <span>→</span></Link>
        </div>
        <div className="hero-scroll"><T en="Scroll to wander" de="Zum Entdecken scrollen" /> <span>↓</span></div>
      </section>

      <section className="intro section-wrap">
        <Reveal><p className="eyebrow"><T en="The journal" de="Das Journal" /></p><h2><T en={<>Travel slowly.<br /><em>Notice everything.</em></>} de={<>Langsam reisen.<br /><em>Alles wahrnehmen.</em>} /></h2></Reveal>
        <Reveal className="intro-copy"><p><T en="Lepigonia is a personal collection of journeys, places, food and fleeting moments from the road. Less itinerary, more memory." de="Lepigonia ist eine persönliche Sammlung von Reisen, Orten, Essen und flüchtigen Momenten unterwegs. Weniger Reiseplan, mehr Erinnerung." /></p><Link href="/about" className="editorial-link"><T en="A little about me" de="Ein wenig über mich" /> <span>→</span></Link></Reveal>
      </section>

      <section id="stories" className="stories section-wrap">
        <Reveal><div className="section-heading"><div><p className="eyebrow"><T en="Recent stories" de="Neue Geschichten" /></p><h2><T en="From the road" de="Von unterwegs" /></h2></div><Link href="/blog" className="editorial-link"><T en="All stories" de="Alle Geschichten" /> <span>→</span></Link></div></Reveal>
        {featured ? <Reveal className="featured-story"><Link href={`/blog/${featured.slug}`}><div className="story-media"><Image src={featured.image || "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=80"} alt={featured.title || "Travel story"} fill sizes="(max-width: 800px) 100vw, 90vw" /></div><div className="story-meta"><span>{featured.location || "Journal"}</span><span>{featured.date || ""}</span></div><h3>{featured.title}</h3><p>{featured.excerpt || "A story from the road."}</p></Link></Reveal> : <div className="content-placeholder"><p className="eyebrow"><T en="Stories coming soon" de="Geschichten folgen bald" /></p><h3><T en="Your next journey belongs here." de="Deine nächste Reise gehört hierher." /></h3><p><T en="Add a Markdown story to /posts and it will appear automatically." de="Füge eine Markdown-Geschichte unter /posts hinzu – sie erscheint automatisch." /></p></div>}
        {rest.length > 0 && <div className="story-grid">{rest.map((post, i) => <Reveal key={post.slug} className={`story-card ${i % 3 === 0 ? "story-card--wide" : ""}`}><Link href={`/blog/${post.slug}`}><div className="story-media"><Image src={post.image || "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=80"} alt={post.title || "Travel story"} fill sizes="(max-width: 800px) 100vw, 45vw" /></div><div className="story-meta"><span>{post.location || "Journal"}</span><span>{post.date || ""}</span></div><h3>{post.title}</h3></Link></Reveal>)}</div>}
      </section>

      <section className="statement"><div><p className="eyebrow"><T en="Why Lepigonia" de="Warum Lepigonia" /></p><p className="statement-text"><T en={<>“Some places are beautiful.<br /><em>Others become part of you.</em>”</>} de={<>„Manche Orte sind schön.<br /><em>Andere werden ein Teil von dir.“</em>}></T></p></div></section>
      <section id="newsletter" className="newsletter-strip section-wrap"><Reveal><p className="eyebrow"><T en="Stay close" de="Bleib dabei" /></p><h2><T en={<>Stories, when there’s<br /><em>something to tell.</em></>} de={<>Geschichten, wenn es<br /><em>etwas zu erzählen gibt.</em>} /></h2><a href="#newsletter" className="editorial-link"><T en="Join the journey" de="Mitreisen" /> <span>→</span></a></Reveal></section>
    </main>
    <Footer />
  </>;
}
