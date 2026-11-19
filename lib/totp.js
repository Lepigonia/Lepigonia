import crypto from "node:crypto";

// RFC 6238 time-based one-time passwords (SHA-1, 6 digits, 30 s) without extra dependencies.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

export function isTotpEnabled() {
  return Boolean(String(process.env.ADMIN_TOTP_SECRET || "").trim());
}

export function base32Decode(input) {
  const clean = String(input || "").toUpperCase().replace(/[\s=-]/g, "");
  if (!clean) throw new Error("Empty base32 secret");
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 secret");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function base32Encode(buffer) {
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

export function hotp(key, counter) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/** Accepts the current 30 s window and one window before/after (clock drift). Throws if the secret is malformed. */
export function verifyTotp(code, secret, now = Date.now()) {
  const submitted = String(code || "").replace(/\s/g, "");
  const key = base32Decode(secret);
  const counter = Math.floor(now / 1000 / STEP_SECONDS);
  const wellFormed = /^\d{6}$/.test(submitted);
  let valid = false;
  for (const drift of [-1, 0, 1]) {
    const expected = Buffer.from(hotp(key, counter + drift));
    const given = Buffer.from(wellFormed ? submitted : "000000");
    if (crypto.timingSafeEqual(expected, given) && wellFormed) valid = true;
  }
  return valid;
}