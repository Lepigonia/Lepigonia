"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const ranges = [
  { value: 7, label: "7 Tage" },
  { value: 30, label: "30 Tage" },
  { value: 90, label: "90 Tage" },
];

function count(value) {
  const number = Number(value?.value ?? value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE").format(count(value));
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(count(seconds)));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return minutes ? `${minutes} Min. ${remainder} Sek.` : `${remainder} Sek.`;
}

function MetricCard({ label, value, note }) {
  return (
    <div className="analytics-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Ranking({ title, items, emptyLabel, formatLabel }) {
  const max = Math.max(1, ...items.map((item) => count(item.y)));
  return (
    <section className="analytics-panel">
      <h2>{title}</h2>
      {items.length ? (
        <ol className="analytics-ranking">
          {items.map((item, index) => (
            <li key={`${item.x}-${index}`}>
              <div className="analytics-ranking-line">
                <span title={String(item.x)}>{formatLabel ? formatLabel(item.x) : item.x || "Direkt / unbekannt"}</span>
                <strong>{formatNumber(item.y)}</strong>
              </div>
              <div className="analytics-track"><i style={{ width: `${Math.max(2, (count(item.y) / max) * 100)}%` }} /></div>
            </li>
          ))}
        </ol>
      ) : <p className="analytics-empty">{emptyLabel}</p>}
    </section>
  );
}

export default function AdminAnalytics() {
  const [range, setRange] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/analytics?range=${range}`, {
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === "UMAMI_API_KEY_MISSING") throw new Error("API-Schlüssel fehlt");
        if (result.error === "UMAMI_API_UNAUTHORIZED") throw new Error("Der Umami-API-Schlüssel wurde nicht akzeptiert. Bitte prüfe ihn in den Vercel-Umgebungsvariablen.");
        throw new Error("Die Analytics-Daten konnten gerade nicht geladen werden.");
      }
      setData(result);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "Unbekannter Fehler");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshIndex]);

  const stats = data?.stats || {};
  const views = count(stats.pageviews);
  const visits = count(stats.visits);
  const visitors = count(stats.visitors);
  const bounceRate = visits ? Math.round((count(stats.bounces) / visits) * 100) : 0;
  const chart = useMemo(() => {
    const rows = data?.pageviews || [];
    const max = Math.max(1, ...rows.map((row) => count(row.y)));
    return rows.map((row) => ({ ...row, height: Math.max(3, (count(row.y) / max) * 100) }));
  }, [data]);

  return (
    <section className="editor analytics-editor">
      <div className="editor-head">
        <div>
          <p className="admin-eyebrow">Lepigonia / Insights</p>
          <h1>Analytics</h1>
        </div>
        <span className={`analytics-status ${websiteId ? "is-ready" : ""}`}>
          {websiteId ? "Umami verbunden" : "Einrichtung ausstehend"}
        </span>
      </div>

      <div className="analytics-toolbar">
        <div className="analytics-range" aria-label="Zeitraum auswählen">
          {ranges.map((item) => (
            <button key={item.value} type="button" className={range === item.value ? "active" : ""} onClick={() => setRange(item.value)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="analytics-toolbar-actions">
          <button type="button" className="analytics-refresh" onClick={() => setRefreshIndex((value) => value + 1)} disabled={loading}>
            {loading ? "Lädt …" : "Aktualisieren ↻"}
          </button>
          <Link href="https://cloud.umami.is/" target="_blank" rel="noreferrer" className="analytics-external">Umami öffnen ↗</Link>
        </div>
      </div>

      {error === "API-Schlüssel fehlt" ? (
        <div className="analytics-notice">
          <h2>Fast geschafft – API-Schlüssel fehlt noch</h2>
          <p>Das Tracking sendet bereits Daten. Damit Lepigonia sie hier anzeigen kann, fehlt nur noch dein Umami-Cloud-API-Key.</p>
          <ol>
            <li>In Umami unter <strong>Settings → API keys</strong> einen API-Key erstellen.</li>
            <li>In Vercel beim Projekt <strong>lepigonia</strong> unter <strong>Settings → Environment Variables</strong> den Schlüssel <code>UMAMI_API_KEY</code> anlegen.</li>
            <li>Den API-Key als Wert eintragen und für <strong>Production</strong> aktivieren. Danach neu deployen.</li>
          </ol>
          <p className="admin-help">Den API-Key bitte nicht hier im Chat oder im Frontend-Code veröffentlichen. Er wird ausschließlich serverseitig verwendet.</p>
        </div>
      ) : error ? (
        <div className="analytics-notice is-error"><strong>Verbindung fehlgeschlagen</strong><p>{error}</p></div>
      ) : null}

      <div className="analytics-stats-grid">
        <MetricCard label="Besucher" value={loading && !data ? "…" : formatNumber(stats.visitors)} note={`Eindeutige Besucher · ${range} Tage`} />
        <MetricCard label="Seitenaufrufe" value={loading && !data ? "…" : formatNumber(stats.pageviews)} note="Aufgerufene Seiten insgesamt" />
        <MetricCard label="Besuche" value={loading && !data ? "…" : formatNumber(stats.visits)} note="Sitzungen auf Lepigonia" />
        <MetricCard label="Absprungrate" value={loading && !data ? "…" : `${bounceRate} %`} note="Besuche mit nur einem Seitenaufruf" />
      </div>

      <section className="analytics-panel analytics-chart-panel">
        <div className="analytics-panel-heading">
          <div><p className="admin-eyebrow">Traffic im Zeitverlauf</p><h2>Seitenaufrufe pro Tag</h2></div>
          <span>{loading ? "Aktualisiere …" : data?.updatedAt ? `Stand ${new Date(data.updatedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
        </div>
        {chart.length ? (
          <div className="analytics-chart" role="img" aria-label="Diagramm der täglichen Seitenaufrufe">
            {chart.map((point, index) => (
              <div className="analytics-chart-column" key={`${point.x}-${index}`} title={`${point.x}: ${formatNumber(point.y)} Aufrufe`}>
                <span>{formatNumber(point.y)}</span><i style={{ height: `${point.height}%` }} />
                <small>{new Date(point.x).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</small>
              </div>
            ))}
          </div>
        ) : <p className="analytics-empty">{loading ? "Daten werden geladen …" : "Für diesen Zeitraum liegen noch keine Seitenaufrufe vor."}</p>}
      </section>

      <div className="analytics-lower-grid">
        <Ranking title="Meistbesuchte Seiten" items={data?.pages || []} emptyLabel="Noch keine Seiten-Daten vorhanden." formatLabel={(value) => value === "/" ? "Startseite" : value} />
        <Ranking title="Zugriffsquellen" items={data?.referrers || []} emptyLabel="Noch keine Referrer-Daten vorhanden." />
        <Ranking title="Länder" items={data?.countries || []} emptyLabel="Noch keine Länder-Daten vorhanden." />
      </div>

      <p className="admin-help analytics-footnote">
        Durchschnittliche Besuchsdauer: {data ? formatDuration(count(stats.totaltime) / Math.max(1, visits)) : "–"} pro Besuch. Die Daten stammen direkt aus deinem Umami-Konto.
      </p>
    </section>
  );
}
