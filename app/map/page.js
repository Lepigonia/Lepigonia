import Link from "next/link";
import { Navbar, Footer, T } from "../../components/SiteChrome";
import { getPosts } from "../../lib/posts";
import WorldMap from "./WorldMap";

export const metadata = { title: "Travelmap", description: "Destinations and journeys from Lepigonia." };

export default function MapPage() {
  const posts = getPosts();
  const locations = posts.filter((post) => Number.isFinite(Number(post.lat)) && Number.isFinite(Number(post.lng)));

  return <>
    <Navbar />
    <main className="section-wrap page-top map-page">
      <div className="map-intro">
        <p className="eyebrow"><T en="The journey" de="Die Reise" /></p>
        <h1 className="page-title"><T en="Every story leaves a mark." de="Jede Geschichte hinterlässt eine Spur." /></h1>
        <p className="page-lead"><T en="Explore the places behind the stories. Follow the route, open a stop and step directly into the chapter." de="Entdecke die Orte hinter den Geschichten. Folge der Route, öffne einen Reisestopp und spring direkt in das passende Kapitel." /></p>
        <div className="map-stats" aria-label="Travel statistics">
          <span><strong>{locations.length}</strong> <T en="stops" de="Reisestopps" /></span>
          <span><strong>{new Set(locations.map((post) => post.country || post.location).filter(Boolean)).size}</strong> <T en="countries" de="Länder" /></span>
        </div>
      </div>

      <WorldMap posts={locations} />

      {locations.length === 0 && <p className="map-empty"><T en="No travel stops with coordinates yet." de="Noch keine Reisestopps mit Koordinaten vorhanden." /></p>}

      {locations.length > 0 && <section className="destination-section" aria-labelledby="destination-heading">
        <div className="section-heading">
          <h2 id="destination-heading"><T en="Stops along the way" de="Reisestopps" /></h2>
          <span className="eyebrow">{locations.length} <T en="stories" de="Geschichten" /></span>
        </div>
        <div className="destination-list">
          {locations.map((post, index) => <Link href={`/blog/${post.slug}`} key={post.slug}>
            <span className="destination-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="destination-name">{post.location || post.title}</span>
            <small>{post.date || post.country || ""}</small>
            <span className="destination-arrow">→</span>
          </Link>)}
        </div>
      </section>}
    </main>
    <Footer />
  </>;
}
