import { Navbar, Footer, T } from "../../components/SiteChrome";

export const metadata = { title: "About", description: "The person and stories behind Lepigonia." };

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="section-wrap page-top about-page">
        <div>
          <p className="eyebrow"><T en="Behind the journal" de="Hinter dem Journal" /></p>
          <h1 className="page-title"><T en="A real person. A life in motion." de="Ein echter Mensch. Ein Leben unterwegs." /></h1>
        </div>
        <div className="about-copy">
          <p><T en="Lepigonia is a personal travel journal — built around real journeys, observations and the places that leave a mark." de="Lepigonia ist ein persönliches Reisetagebuch – geprägt von echten Reisen, Beobachtungen und Orten, die Spuren hinterlassen." /></p>
          <p><T en="The site is intentionally simple at its core: stories first, beautiful photography second, and everything else in service of the experience." de="Im Mittelpunkt stehen Geschichten: zuerst die Reise, dann die Fotografie und alles andere im Dienst des Erlebnisses." /></p>
          <p className="muted"><T en="More personal details, your portrait and the story behind the name can be added here as the journal grows." de="Weitere persönliche Details, dein Portrait und die Geschichte hinter dem Namen können hier ergänzt werden, wenn das Journal wächst." /></p>
        </div>
      </main>
      <Footer />
    </>
  );
}
