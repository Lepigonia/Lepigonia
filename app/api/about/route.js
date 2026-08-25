import { NextResponse } from "next/server";
import { getGithubFile } from "../../../lib/admin";

const fallback = {
  en: { eyebrow: "Behind the journal", title: "A real person. A life in motion.", paragraphs: ["Lepigonia is a personal travel journal — built around real journeys, observations and the places that leave a mark.", "The site is intentionally simple at its core: stories first, beautiful photography second, and everything else in service of the experience.", "More personal details, your portrait and the story behind the name can be added here as the journal grows."] },
  de: { eyebrow: "Hinter dem Journal", title: "Ein echter Mensch. Ein Leben unterwegs.", paragraphs: ["Lepigonia ist ein persönliches Reisetagebuch – geprägt von echten Reisen, Beobachtungen und Orten, die Spuren hinterlassen.", "Im Mittelpunkt stehen Geschichten: zuerst die Reise, dann die Fotografie und alles andere im Dienst des Erlebnisses.", "Weitere persönliche Details, dein Portrait und die Geschichte hinter dem Namen können hier ergänzt werden, wenn das Journal wächst."] }
};

export async function GET() {
  try { const f = await getGithubFile("data/about.json"); return NextResponse.json(JSON.parse(Buffer.from(f.content, "base64").toString("utf8"))); }
  catch { return NextResponse.json(fallback); }
}
