import "./globals.css";
import { Footer } from "../components/SiteChrome";

export const metadata = {
  metadataBase: new URL("https://lepigonia.vercel.app"),
  title: { default: "Lepigonia — Personal Travel Journal", template: "%s — Lepigonia" },
  description: "A personal travel journal of slow journeys, beautiful places, food and moments from the road.",
  openGraph: { title: "Lepigonia — Personal Travel Journal", description: "Slow travel, personal stories and beautiful moments from the road.", type: "website", images: [{ url: "/og.jpg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Lepigonia — Personal Travel Journal", description: "Slow travel, personal stories and beautiful moments from the road." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
