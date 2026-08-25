"use client";

import { useState } from "react";
import Link from "next/link";
import { adminApi } from "../../lib/admin-api";

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await adminApi.login({ email, password });
      await onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <Link href="/" className="admin-brand">Lepigonia</Link>
      <div className="login-card">
        <p className="admin-eyebrow">Private area</p>
        <h1>Admin Login</h1>
        <p>Geschichten und Galerie verwalten.</p>
        <form onSubmit={submit}>
          <label>E-Mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Passwort<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button disabled={busy}>{busy ? "Einloggen …" : "Einloggen →"}</button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      </div>
    </main>
  );
}
