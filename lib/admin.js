import crypto from "node:crypto";
import { ensureDatabase, sql } from "./db";

const COOKIE = "lepigonia_auth";
const SESSION_MS = 12 * 60 * 60 * 1000;
const SESSION_SECONDS = SESSION_MS / 1000;
const SESSION_VERSION = 3;
const getSecret = () => {
  if (!process.env.ADMIN_SESSION_SECRET) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return process.env.ADMIN_SESSION_SECRET;
};

/** The configured admin e-mail, normalised exactly like the e-mail typed into the login form. */
export const getAdminEmail = () => String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();

const sign = (payload) => crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");

function readToken(value) {
  if (!value || typeof value !== "string") return null;
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payload, sig] = parts;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { return null; }
}

// Checks signature, expiry and identity of the cookie only (no database access).
function readSession(request) {
  try {
    const data = readToken(request.cookies.get(COOKIE)?.value);
    const adminEmail = getAdminEmail();
    if (!data || !adminEmail) return null;
    if (data.v !== SESSION_VERSION || typeof data.sid !== "string" || !data.sid) return null;
    if (!Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
    if (data.role !== "admin" || data.email !== adminEmail) return null;
    return data;
  } catch { return null; }
}

/**
 * Sessions are signed cookies AND rows in admin_sessions, so a logout (or a deleted row) really ends a session.
 * Fails closed: any error means "not authenticated".
 */
export async function getAuth(request) {
  try {
    const claims = readSession(request);
    if (!claims) return null;
    await ensureDatabase();
    const db = sql();
    const rows = await db`SELECT id FROM admin_sessions WHERE id=${claims.sid} AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1`;
    if (!rows.length) return null;
    return { email: claims.email, role: "admin", sid: claims.sid };
  } catch { return null; }
}

// NOTE: async on purpose - always call as `await verifyAdmin(request)`.
export async function verifyAdmin(request) {
  return (await getAuth(request))?.role === "admin";
}

export async function createSession() {
  await ensureDatabase();
  const db = sql();
  const sid = crypto.randomBytes(24).toString("base64url");
  const exp = Date.now() + SESSION_MS;
  await db`DELETE FROM admin_sessions WHERE expires_at < NOW() - INTERVAL '1 day'`;
  await db`INSERT INTO admin_sessions (id, expires_at) VALUES (${sid}, ${new Date(exp).toISOString()})`;
  const payload = Buffer.from(JSON.stringify({ v: SESSION_VERSION, sid, email: getAdminEmail(), role: "admin", exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function revokeSession(request) {
  try {
    const data = readToken(request.cookies.get(COOKIE)?.value);
    if (!data || typeof data.sid !== "string" || !data.sid) return false;
    await ensureDatabase();
    const db = sql();
    await db`UPDATE admin_sessions SET revoked_at=NOW() WHERE id=${data.sid} AND revoked_at IS NULL`;
    return true;
  } catch (error) {
    console.warn("Session revoke failed:", error?.message || error);
    return false;
  }
}

const cookieBase = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/" });
export const setSessionCookie = (response, token) => response.cookies.set(COOKIE, token, { ...cookieBase(), maxAge: SESSION_SECONDS });
export const clearAdminCookie = (response) => response.cookies.set(COOKIE, "", { ...cookieBase(), maxAge: 0 });

export async function checkAdminLoginRateLimit(request) {
  await ensureDatabase();
  const db = sql();
  const forwarded = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const ip = forwarded.split(",")[0].trim().slice(0, 100) || "unknown";
  const ipHash = crypto.createHmac("sha256", getSecret()).update(ip).digest("hex");
  await db`DELETE FROM admin_login_attempts WHERE attempted_at < NOW() - INTERVAL '1 day'`;
  await db`INSERT INTO admin_login_attempts (ip_hash) VALUES (${ipHash})`;
  const rows = await db`SELECT COUNT(*)::int AS attempts FROM admin_login_attempts WHERE ip_hash=${ipHash} AND attempted_at > NOW() - INTERVAL '15 minutes'`;
  return Number(rows[0]?.attempts || 0) <= 8;
}

export async function checkNewsletterSignupRateLimit(request) {
  await ensureDatabase();
  const db = sql();
  const forwarded = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const ip = forwarded.split(",")[0].trim().slice(0, 100) || "unknown";
  const ipHash = crypto.createHmac("sha256", getSecret()).update(ip).digest("hex");
  await db`DELETE FROM newsletter_signup_attempts WHERE attempted_at < NOW() - INTERVAL '1 day'`;
  await db`INSERT INTO newsletter_signup_attempts (ip_hash) VALUES (${ipHash})`;
  const rows = await db`SELECT COUNT(*)::int AS attempts FROM newsletter_signup_attempts WHERE ip_hash=${ipHash} AND attempted_at > NOW() - INTERVAL '1 hour'`;
  return Number(rows[0]?.attempts || 0) <= 5;
}

export function githubConfig() {
  if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not configured");
  return { token: process.env.GITHUB_TOKEN, owner: process.env.GITHUB_OWNER || "Lepigonia", repo: process.env.GITHUB_REPO || "Lepigonia", branch: process.env.GITHUB_BRANCH || "main" };
}
export async function githubRequest(path, options = {}) {
  const { token } = githubConfig();
  const r = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", ...(options.headers || {}) },
    cache: "no-store",
  });
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!r.ok) throw new Error(data?.message || `GitHub request failed (${r.status})`);
  return data;
}
export async function getGithubFile(path) {
  const { owner, repo, branch } = githubConfig();
  return githubRequest(`/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`);
}
export async function putGithubFile(path, content, message, sha) {
  const { owner, repo, branch } = githubConfig();
  const body = { message, content: Buffer.from(content, "utf8").toString("base64"), branch };
  if (sha) body.sha = sha;
  return githubRequest(`/repos/${owner}/${repo}/contents/${path}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
export async function deleteGithubFile(path, message, sha) {
  const { owner, repo, branch } = githubConfig();
  return githubRequest(`/repos/${owner}/${repo}/contents/${path}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, sha, branch }) });
}