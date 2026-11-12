import crypto from "node:crypto";
import { ensureDatabase, sql } from "./db";

const COOKIE = "lepigonia_auth";
const SESSION_MS = 12 * 60 * 60 * 1000;
const SESSION_SECONDS = SESSION_MS / 1000;
const getSecret = () => {
  if (!process.env.ADMIN_SESSION_SECRET) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return process.env.ADMIN_SESSION_SECRET;
};

export function makeSession(email, role = "admin") {
  const payload = Buffer.from(JSON.stringify({ email, role, exp: Date.now() + SESSION_MS })).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function getAuth(request) {
  try {
    const value = request.cookies.get(COOKIE)?.value;
    if (!value) return null;
    const [payload, sig] = value.split(".");
    const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
    if (!sig || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
    if (data.role !== "admin" || data.email !== process.env.ADMIN_EMAIL) return null;
    return { email: data.email, role: "admin" };
  } catch { return null; }
}

export const isAdmin = (request) => getAuth(request)?.role === "admin";

export const setAuthCookie = (response, email, role = "admin") => response.cookies.set(COOKIE, makeSession(email, role), {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: SESSION_SECONDS,
});

export const setAdminCookie = (response, email) => setAuthCookie(response, email, "admin");
export const clearAdminCookie = (response) => response.cookies.set(COOKIE, "", {
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0,
});

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
