import Script from "next/script";
import "./globals.css";
import "./responsive.css";

export const metadata = {
  metadataBase: new URL("https://lepigonia.vercel.app"),
  title: { default: "Lepigonia — Personal Travel Journal", template: "%s — Lepigonia" },
  description: "A personal travel journal of slow journeys, beautiful places, food and moments from the road.",
  openGraph: { title: "Lepigonia — Personal Travel Journal", description: "Slow travel, personal stories and beautiful moments from the road.", type: "website", images: [{ url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80", width: 1200, height: 800 }] },
  twitter: { card: "summary_large_image", title: "Lepigonia — Personal Travel Journal", description: "Slow travel, personal stories and beautiful moments from the road.", images: ["https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <html lang="en">
      <body>
        {children}
        {umamiWebsiteId ? (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id={umamiWebsiteId}
            data-exclude-search="true"
            data-exclude-hash="true"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
