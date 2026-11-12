"use client";

import Link from "next/link";

export default function AdminAnalytics() {
  return (
    <section className="editor analytics-editor">
      <div className="editor-head">
        <div>
          <p className="admin-eyebrow">Lepigonia / Insights</p>
          <h1>Analytics</h1>
        </div>
        <span className="analytics-status is-ready">Tracking aktiv</span>
      </div>

      <div className="analytics-card">
        <p className="admin-eyebrow">Website-Statistiken</p>
        <h2>Deine Besucherzahlen bei Umami</h2>
        <p>
          Das Umami-Tracking ist in Lepigonia eingebunden und erfasst die
          Website-Aufrufe. Die Auswertung kannst du direkt in deinem
          Umami-Dashboard ansehen. Eine zusätzliche API-Anbindung ist dafür
          nicht erforderlich.
        </p>
        <Link
          href="https://cloud.umami.is/"
          target="_blank"
          rel="noopener noreferrer"
          className="analytics-action"
        >
          Umami-Dashboard öffnen ↗
        </Link>
      </div>
    </section>
  );
}
