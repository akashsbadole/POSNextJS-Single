import { randomBytes, createHmac } from "crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = 0; let value = 0; let output = "";
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(s: string): Buffer {
  const cleaned = s.replace(/=+$/, "").toUpperCase();
  const buf = Buffer.alloc(Math.ceil(cleaned.length * 5 / 8));
  let bits = 0; let value = 0; let pos = 0;
  for (const c of cleaned) {
    const idx = BASE32.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      buf[pos++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return buf.subarray(0, pos);
}

export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

export function generateToken(secret: string, timestamp: number = Date.now()): string {
  const epoch = Math.floor(timestamp / 30000);
  const buf = Buffer.alloc(8);
  let e = epoch;
  for (let i = 7; i >= 0; i--) { buf[i] = e & 0xff; e >>>= 8; }
  const key = base32Decode(secret);
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(code % 1000000).padStart(6, "0");
}

export function verifyToken(secret: string, token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const now = Date.now();
  for (let drift = -1; drift <= 1; drift++) {
    if (generateToken(secret, now + drift * 30000) === token) return true;
  }
  return false;
}

export function otpauthUri(secret: string, email: string, issuer = "PharmacyPro"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
