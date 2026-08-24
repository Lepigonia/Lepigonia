"use client";
import { useState } from "react";
import Link from "next/link";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Anmeldung fehlgeschlagen."); setLoading(false); return; }
      window.location.href = data.redirect || "/";
    } catch { setError("Verbindung fehlgeschlagen. Bitte erneut versuchen."); setLoading(false); }
  }

  return <main className="login-page">
    <Link href="/" className="login-wordmark">Lepigonia</Link>
    <section className="login-panel">
      <p className="login-eyebrow">Lepigonia Account</p>
      <h1>Willkommen zurück.</h1>
      <p className="login-copy">Melde dich an, um deinen persönlichen Bereich zu öffnen.</p>
      <form onSubmit={submit}>
        <label>E-Mail<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Passwort<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button disabled={loading}>{loading ? "Anmelden …" : "Anmelden →"}</button>
        {error && <p className="login-error">{error}</p>}
      </form>
      <Link href="/" className="back-link">← Zur Website</Link>
    </section>
  </main>;
}
