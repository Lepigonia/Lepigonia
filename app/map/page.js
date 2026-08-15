import Link from "next/link";
import { Navbar, Footer, T } from "../../components/SiteChrome";
import { getPosts } from "../../lib/posts";

export const metadata = { title: "Travelmap", description: "Destinations and journeys from Lepigonia." };

export default function MapPage() {
  const posts = getPosts();
  const locations = posts.filter((post) => post.location);
  return (
    <>
      <Navbar />
      <main className="section-wrap page-top map-page">
        <p className="eyebrow"><T en="Travelmap" de="Reisekarte" /></p>
        <h1 className="page-title">
          <T en="Places I’ve been. Places I want to return to." de="Orte, an denen ich war. Orte, zu denen ich zurückkehren möchte." />
        </h1>
        <p className="page-lead"><T en="A living map of the journey. As stories are added, destinations will collect here automatically." de="Eine lebendige Karte der Reise. Mit jeder neuen Geschichte wachsen hier die Reiseziele automatisch." /></p>
        <div className="map-panel">
          <div className="map-lines" />
          <div className="map-center"><span className="map-pin" /><p><T en="The journey is just beginning." de="Die Reise beginnt gerade erst." /></p></div>
        </div>
        {locations.length > 0 && <div className="destination-list">{locations.map((post) => <Link href={`/blog/${post.slug}`} key={post.slug}><span>{post.location}</span><small>{post.date || ""}</small></Link>)}</div>}
      </main>
      <Footer />
    </>
  );
}
