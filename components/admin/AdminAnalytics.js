"use client";

import Link from "next/link";

const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function AdminAnalytics() {
  const configured = Boolean(websiteId);

  return (
    <section className="editor analytics-editor">
      <div className="editor-head">
        <div>
          <p className="admin-eyebrow">Lepigonia / Insights</p>
          <h1>Analytics</h1>
        </div>
        <span className={`analytics-status ${configured ? "is-ready" : ""}`}>
          {configured ? "Tracking konfiguriert" : "Einrichtung ausstehend"}
        </span>
      </div>
      <p className="analytics-lead">
        Hier bekommst du künftig einen schnellen Überblick über Besucher, Seitenaufrufe,
        Herkunftsländer, Zugriffsquellen und die beliebtesten Geschichten.
      </p>
      <div className="analytics-card">
        <span className="admin-eyebrow">Dein Analytics-Konto</span>
        <h2>{configured ? "Umami ist verbunden" : "Umami ist noch nicht verbunden"}</h2>
        <p>
          {configured
            ? "Die Website-ID ist in der Website-Konfiguration hinterlegt. Öffne dein Umami-Dashboard, um die ersten erfassten Besuche zu sehen."
            : "Lege zuerst ein kostenloses Umami-Cloud-Konto an und füge Lepigonia dort als Website hinzu. Danach verbinden wir die Website mit deiner persönlichen Website-ID."}
        </p>
        <Link className="analytics-action" href="https://cloud.umami.is/signup" target="_blank" rel="noreferrer">
          {configured ? "Umami-Dashboard öffnen" : "Umami-Konto erstellen"} ↗
        </Link>
      </div>
      <div className="analytics-next">
        <h2>Was du hier sehen wirst</h2>
        <div className="analytics-metrics">
          <div><strong>Besucher</strong><span>Täglich, 7 Tage und 30 Tage</span></div>
          <div><strong>Herkunft</strong><span>Länder und Zugriffsquellen</span></div>
          <div><strong>Beliebte Inhalte</strong><span>Meistbesuchte Seiten und Stories</span></div>
          <div><strong>Entwicklung</strong><span>Traffic im Zeitverlauf</span></div>
        </div>
      </div>
      <p className="admin-help">
        Hinweis: Bis die Website-ID eingetragen und der erste Besuch erfasst wurde, bleiben die
        Statistiken leer. Es werden keine Besucherzahlen simuliert.
      </p>
    </section>
  );
}
