"use client";

import { useCallback, useEffect, useState } from "react";

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/newsletter", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Newsletter-Liste konnte nicht geladen werden.");
      setSubscribers(data.subscribers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(entry) {
    if (!confirm(`Die Anmeldung von ${entry.email} endgültig löschen?`)) return;
    setBusyId(entry.id);
    setError("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Löschen fehlgeschlagen.");
      setSubscribers((items) => items.filter((item) => item.id !== entry.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId("");
    }
  }

  function formatDate(value) {
    if (!value) return "–";
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }

  return (
    <section className="editor newsletter-admin">
      <div className="editor-head">
        <div>
          <p className="admin-eyebrow">Lepigonia / Community</p>
          <h1>Newsletter</h1>
          <p>Alle Einwilligungen an einem Ort. Die Liste bleibt privat und ist nur im Admin-Bereich sichtbar.</p>
        </div>
      </div>
      <div className="newsletter-admin-summary">
        <div><strong>{subscribers.length}</strong><span>Aktive Anmeldungen</span></div>
        <div><strong>{subscribers.filter((item) => item.source === "popup").length}</strong><span>Über Pop-up</span></div>
        <div><strong>{subscribers.filter((item) => item.source === "newsletter-link").length}</strong><span>Über Newsletter-Link</span></div>
      </div>
      <div className="newsletter-admin-toolbar">
        <button type="button" className="save" onClick={load} disabled={loading}>Liste aktualisieren</button>
        <a className="analytics-action" href="/api/admin/newsletter?format=csv">CSV exportieren ↓</a>
      </div>
      {loading ? <p className="status">Lade Anmeldungen …</p> : subscribers.length ? (
        <div className="newsletter-table-wrap">
          <table className="newsletter-table">
            <thead><tr><th>E-Mail-Adresse</th><th>Angemeldet am</th><th>Quelle</th><th>Aktion</th></tr></thead>
            <tbody>{subscribers.map((entry) => (
              <tr key={entry.id}>
                <td data-label="E-Mail-Adresse">{entry.email}</td>
                <td data-label="Angemeldet am">{formatDate(entry.consentedAt || entry.createdAt)}</td>
                <td data-label="Quelle">{entry.source === "popup" ? "Pop-up" : "Newsletter-Link"}</td>
                <td data-label="Aktion"><button className="danger" type="button" disabled={busyId === entry.id} onClick={() => remove(entry)}>{busyId === entry.id ? "Lösche …" : "Löschen"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : !error ? <div className="newsletter-empty"><h2>Noch keine Anmeldungen</h2><p>Sobald sich jemand über das Pop-up oder den Newsletter-Link einträgt und die Einwilligung bestätigt, erscheint die Adresse hier.</p></div> : null}
      {error && <p className="admin-error">{error}</p>}
      <p className="newsletter-admin-note">Gespeichert werden E-Mail-Adresse, Zeitpunkt, Einwilligungstext und Anmeldequelle. Es werden derzeit keine Newsletter versendet. Einträge kannst du hier löschen oder als CSV exportieren.</p>
    </section>
  );
}
