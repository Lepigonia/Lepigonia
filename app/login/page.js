"use client";
import { useState } from "react";
import Link from "next/link";
import { T } from "../../components/SiteChrome";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      window.location.href = data.redirect || "/";
    } catch {
      setError("Connection failed. Please try again.");
      setLoading(false);
    }
  }

  return <main className="login-page">
    <Link href="/" className="login-wordmark">Lepigonia</Link>
    <section className="login-panel">
      <p className="login-eyebrow"><T en="Lepigonia Account" de="Lepigonia Konto" /></p>
      <h1><T en="Welcome back." de="Willkommen zurück." /></h1>
      <p className="login-copy"><T en="Sign in to open your personal area." de="Melde dich an, um deinen persönlichen Bereich zu öffnen." /></p>
      <form onSubmit={submit}>
        <label><T en="Email" de="E-Mail" /><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label><T en="Password" de="Passwort" /><input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button type="submit" disabled={loading}>{loading ? <T en="Signing in …" de="Anmelden …" /> : <T en="Sign in →" de="Anmelden →" />}</button>
        {error && <p className="login-error" role="alert">{error}</p>}
      </form>
      <Link href="/" className="back-link"><T en="← Back to the website" de="← Zur Website" /></Link>
    </section>
  </main>;
}
