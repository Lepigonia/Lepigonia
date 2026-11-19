import crypto from "node:crypto";

export const CONSENT_VERSION = "newsletter-consent-2026-11-doi";
export const CONSENT_TEXT = "Ich möchte den Lepigonia-Newsletter mit Reisegeschichten und Neuigkeiten per E-Mail erhalten. Meine E-Mail-Adresse und der Zeitpunkt meiner Einwilligung werden dafür gespeichert. Nach der Anmeldung erhalte ich eine E-Mail mit einem Bestätigungslink; meine Anmeldung wird erst durch Klick auf diesen Link wirksam. Ich kann meine Einwilligung jederzeit widerrufen.";

export function siteUrl() {
  return String(process.env.SITE_URL || "https://lepigonia.vercel.app").replace(/\/+$/, "");
}

export function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function tokenSecret() {
  const secret = process.env.NEWSLETTER_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("NEWSLETTER_TOKEN_SECRET or ADMIN_SESSION_SECRET is not configured");
  return secret;
}

/** Stateless token for unsubscribe links, bound to the subscriber id. */
export function unsubscribeToken(id) {
  return crypto.createHmac("sha256", tokenSecret()).update(`newsletter-unsubscribe:${id}`).digest("base64url");
}

export function isValidUnsubscribeToken(id, token) {
  try {
    const expected = Buffer.from(unsubscribeToken(String(id || "")));
    const given = Buffer.from(String(token || ""));
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

export function confirmUrl(token) {
  return `${siteUrl()}/newsletter/confirm?token=${encodeURIComponent(token)}`;
}

export function unsubscribeUrl(id) {
  return `${siteUrl()}/newsletter/unsubscribe?id=${encodeURIComponent(id)}&t=${encodeURIComponent(unsubscribeToken(id))}`;
}

export function confirmationMail(token) {
  const url = confirmUrl(token);
  const subject = "Bitte bestätige deine Anmeldung · Please confirm your subscription";
  const text = [
    "Hallo,",
    "",
    "vielen Dank für dein Interesse am Lepigonia-Newsletter. Bitte bestätige deine Anmeldung über diesen Link (48 Stunden gültig):",
    "",
    url,
    "",
    "Wenn du dich nicht angemeldet hast, ignoriere diese E-Mail einfach. Deine Adresse wird dann nicht für den Newsletter verwendet und nach kurzer Zeit gelöscht.",
    "",
    "—",
    "",
    "Hello,",
    "",
    "thank you for your interest in the Lepigonia newsletter. Please confirm your subscription with this link (valid for 48 hours):",
    "",
    url,
    "",
    "If you did not sign up, just ignore this email. Your address will not be used for the newsletter and will be deleted shortly.",
    "",
    "Lepigonia",
  ].join("\n");
  const html = [
    "<p>Hallo,</p>",
    `<p>vielen Dank für dein Interesse am Lepigonia-Newsletter. Bitte bestätige deine Anmeldung (Link 48 Stunden gültig):<br><a href="${url}">Anmeldung bestätigen</a></p>`,
    "<p>Wenn du dich nicht angemeldet hast, ignoriere diese E-Mail einfach. Deine Adresse wird dann nicht für den Newsletter verwendet und nach kurzer Zeit gelöscht.</p>",
    "<hr>",
    "<p>Hello,</p>",
    `<p>thank you for your interest in the Lepigonia newsletter. Please confirm your subscription (link valid for 48 hours):<br><a href="${url}">Confirm subscription</a></p>`,
    "<p>If you did not sign up, just ignore this email. Your address will not be used for the newsletter and will be deleted shortly.</p>",
    "<p>Lepigonia</p>",
  ].join("");
  return { subject, text, html };
}