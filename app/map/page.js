import Link from "next/link";
import { Navbar, Footer, T } from "../../components/SiteChrome";
import { getPosts } from "../../lib/posts";
import WorldMap from "./WorldMap";

export const metadata = { title: "Travelmap", description: "Destinations and journeys from Lepigonia." };

export default function MapPage() {
  const posts = getPosts();
  const locations = posts.filter(post => Number.isFinite(Number(post.lat)) && Number.isFinite(Number(post.lng)));
  return (
    <>
      <Navbar />
      <main className="section-wrap page-top map-page">
        <p className="eyebrow"><T en="Travelmap" de="Reisekarte" /></p>
        <h1 className="page-title"><T en="Places I’ve been. Places I want to return to." de="Orte, an denen ich war. Orte, zu denen ich zurückkehren möchte." /></h1>
        <p className="page-lead"><T en="Every story can become a pin on the journey. Add latitude and longitude in the admin editor to place it on the map." de="Jede Geschichte kann zu einem Pin auf der Reise werden. Im Admin-Bereich lassen sich Breitengrad und Längengrad festlegen." /></p>
        <WorldMap posts={locations} />
        {locations.length === 0 && <p className="map-empty">Noch keine Reisestopps mit Koordinaten vorhanden.</p>}
        {locations.length > 0 && <div className="destination-list">{locations.map(post => <Link href={`/blog/${post.slug}`} key={post.slug}><span>{post.location || post.title}</span><small>{post.date || ""}</small></Link>)}</div>}
      </main>
      <Footer />
    </>
  );
}
