// ============================================================
// src/lib/cryptoVault.ts
// Zero-Knowledge E2EE using Web Crypto API (SubtleCrypto)
// Algorithm: AES-GCM-256 with PBKDF2 key derivation
//
// KEY BOUNDARY — CryptoKey objects are non-extractable.
// They are NEVER serialised or sent over any network request.
// The decryption key lives only in browser memory for the session duration.
// ============================================================

import type { ClinicalRecord, EncryptedBlob } from '../types'

const SCHEMA_VERSION = '1.0'
const PBKDF2_ITERATIONS = 310_000 // OWASP 2023 recommendation for SHA-256
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

// ── Custom errors ────────────────────────────────────────────

/** Maps to HTTP 403 KEY_SIGNATURE_MISMATCH */
export class KeyDerivationError extends Error {
  readonly code = 'KEY_SIGNATURE_MISMATCH' as const
  constructor(reason: string) {
    super(`Key derivation failed: ${reason}`)
    this.name = 'KeyDerivationError'
  }
}

// ── Base58 utilities ─────────────────────────────────────────

function base58Decode(str: string): Uint8Array {
  let n = BigInt(0)
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char)
    if (idx < 0) throw new KeyDerivationError(`Invalid base58 character: '${char}'`)
    n = n * 64n + BigInt(idx)
  }
  const hex = n.toString(16).padStart(64, '0')
  return new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
}

function base58Encode(bytes: Uint8Array): string {
  let n = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
  let result = ''
  while (n > 0n) {
    result = BASE58_ALPHABET[Number(n % 64n)] + result
    n = n / 64n
  }
  return result || BASE58_ALPHABET[0]
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(str: string): Uint8Array {
  return new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)))
}

// ── Core crypto operations ───────────────────────────────────

/**
 * Derives an AES-GCM-256 CryptoKey from the patient QR payload.
 * Uses PBKDF2 with 310,000 iterations (OWASP 2023).
 *
 * @throws {KeyDerivationError} if qrPayload contains invalid base58 characters
 *
 * KEY BOUNDARY — the returned CryptoKey is non-extractable.
 * It must never be serialised or sent over any network request.
 */
export async function deriveKeyFromQR(
  qrPayload: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  let seedBytes: Uint8Array
  try {
    seedBytes = base58Decode(qrPayload)
  } catch (e) {
    throw new KeyDerivationError('QR payload is not valid base58')
  }

  // Import the raw seed as a PBKDF2 key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    seedBytes,
    'PBKDF2',
    false, // non-extractable
    ['deriveKey'],
  )

  // Derive the AES-GCM-256 key
  // KEY BOUNDARY — this key never leaves the browser
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable — cannot be exported
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypts a ClinicalRecord with AES-GCM-256.
 *
 * PRIVACY BOUNDARY — meta.qrSalt is stripped from the record
 * before encryption. The salt is used only for key derivation
 * and must never be stored alongside encrypted data.
 */
export async function encryptRecord(
  record: ClinicalRecord,
  key: CryptoKey,
): Promise<EncryptedBlob> {
  // PRIVACY BOUNDARY — strip qrSalt before encrypting
  const { meta: { qrSalt: _stripped, ...metaWithoutSalt }, ...rest } = record
  const sanitised = { ...rest, meta: metaWithoutSalt }

  const plaintext = new TextEncoder().encode(JSON.stringify(sanitised))
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for AES-GCM

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext,
  )

  return {
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertextBuffer)),
    authTag: 'AES-GCM-256',
    schemaVersion: SCHEMA_VERSION,
  }
}

/**
 * Decrypts an EncryptedBlob back to a ClinicalRecord.
 * @throws if the key is wrong or data has been tampered with (AES-GCM auth fail)
 */
export async function decryptRecord(
  blob: EncryptedBlob,
  key: CryptoKey,
): Promise<Omit<ClinicalRecord, 'meta'> & { meta: Omit<ClinicalRecord['meta'], 'qrSalt'> }> {
  const iv = fromBase64(blob.iv)
  const ciphertext = fromBase64(blob.ciphertext)

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )

  return JSON.parse(new TextDecoder().decode(plaintextBuffer))
}

/**
 * Generates a new patient QR payload.
 * Returns a cryptographically random 32-byte seed encoded as base58,
 * and a random 16-byte salt for PBKDF2.
 *
 * The qrPayload should be encoded into a QR code shown only to the patient.
 * The salt should be stored alongside blind_records (not with the key).
 */
export async function generatePatientQR(): Promise<{
  qrPayload: string
  salt: string
}> {
  const seed = crypto.getRandomValues(new Uint8Array(32))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return {
    qrPayload: base58Encode(seed),
    salt: toBase64(salt),
  }
}

/**
 * Computes SHA-256 of ciphertext for deduplication in blind_records.
 * This allows the server to detect duplicate uploads without decrypting.
 */
export async function computeRecordHash(ciphertext: string): Promise<string> {
  const data = new TextEncoder().encode(ciphertext)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
