// src/services/cryptoService.js
//
// Real AES-256-GCM encryption via the Web Crypto API, with keys derived
// from a user password using PBKDF2 (SHA-256, 210,000 iterations —
// OWASP's 2023 recommended minimum for PBKDF2-HMAC-SHA256).
//
// No passwords, keys, or plaintext ever leave this module / the browser.

const PBKDF2_ITERATIONS = 210000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes, recommended for AES-GCM
const KEY_LENGTH = 256; // bits
const MAGIC = "SVC1"; // StegaVault Container v1

function getRandomBytes(length) {
  // crypto.getRandomValues is a CSPRNG — never use Math.random() for security.
  return crypto.getRandomValues(new Uint8Array(length));
}

async function deriveKey(password, salt, usages = ["encrypt", "decrypt"]) {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    usages
  );
}

function concatBytes(...arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/**
 * Encrypt a Uint8Array of plaintext bytes with a password.
 * Container layout: MAGIC(4) | salt(16) | iv(12) | ciphertext+tag(N)
 * Returns a Uint8Array ready to be embedded or exported.
 */
export async function encryptBytes(plaintextBytes, password) {
  if (!password) throw new Error("A password is required for encryption.");
  const salt = getRandomBytes(SALT_LENGTH);
  const iv = getRandomBytes(IV_LENGTH);
  const key = await deriveKey(password, salt, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintextBytes)
  );
  const magicBytes = new TextEncoder().encode(MAGIC);
  return concatBytes(magicBytes, salt, iv, ciphertext);
}

/**
 * Decrypt a container produced by encryptBytes. Throws if the password is
 * wrong or the data has been tampered with (AES-GCM authentication fails).
 */
export async function decryptBytes(containerBytes, password) {
  if (!password) throw new Error("A password is required for decryption.");
  const magicBytes = containerBytes.slice(0, 4);
  const magic = new TextDecoder().decode(magicBytes);
  if (magic !== MAGIC) {
    throw new Error("Unrecognized or corrupted encrypted container.");
  }
  const salt = containerBytes.slice(4, 4 + SALT_LENGTH);
  const iv = containerBytes.slice(4 + SALT_LENGTH, 4 + SALT_LENGTH + IV_LENGTH);
  const ciphertext = containerBytes.slice(4 + SALT_LENGTH + IV_LENGTH);
  const key = await deriveKey(password, salt, ["decrypt"]);
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new Uint8Array(plaintext);
  } catch (e) {
    throw new Error("Decryption failed. Incorrect password or corrupted/tampered data.");
  }
}

export async function encryptText(text, password) {
  return encryptBytes(new TextEncoder().encode(text), password);
}

export async function decryptToText(containerBytes, password) {
  const bytes = await decryptBytes(containerBytes, password);
  return new TextDecoder().decode(bytes);
}

/** SHA-256 integrity hash, returned as a lowercase hex string. */
export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function estimatePasswordStrength(password) {
  if (!password) return { score: 0, label: "Empty" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong", "Excellent"];
  return { score, label: labels[Math.min(score, labels.length - 1)] };
}

export const CRYPTO_CONSTANTS = { PBKDF2_ITERATIONS, SALT_LENGTH, IV_LENGTH, KEY_LENGTH, MAGIC };
