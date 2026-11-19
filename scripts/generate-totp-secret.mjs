// Generates a secret for the optional admin two-factor login (ADMIN_TOTP_SECRET).
// Usage: npm run totp:generate -- you@example.com
import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

const secret = base32Encode(crypto.randomBytes(20));
const account = process.argv[2] || "admin";
const issuer = "Lepigonia";
const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

console.log("ADMIN_TOTP_SECRET (in Vercel als Environment Variable eintragen):\n");
console.log(secret);
console.log("\nIn der Authenticator-App (Google Authenticator, Aegis, 1Password, ...) per \"Schlüssel manuell eingeben\" hinzufügen.");
console.log("Alternativ den folgenden otpauth-Link als QR-Code erzeugen:\n");
console.log(uri);
console.log("\nHinweis: Erst nach dem Hinzufügen in der App den Wert in Vercel setzen und neu deployen - danach ist der Code beim Login Pflicht.");