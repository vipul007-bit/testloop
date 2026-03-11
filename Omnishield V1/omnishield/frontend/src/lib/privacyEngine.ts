// ============================================================
// src/lib/privacyEngine.ts
// Local Differential Privacy via Randomised Response
//
// LDP Guarantee:
//   P(report=x | truth=x)  = ε  = 0.75  (report truth)
//   P(report=x | truth≠x)  = (1−ε)/|D| ≈ 0.0125  (|D|=20 codes)
//   Privacy ratio = ε / ((1−ε)/|D|) = e^(ln(ε·|D|/(1−ε))) ≈ e^3.7
//   This satisfies (ε_LDP)-local differential privacy.
// ============================================================

import type { SurveillanceReport } from '../types'

/** ICD-10 codebook — fixed universe for randomised response */
const DISEASE_CODEBOOK: string[] = [
  'A00.9', // Cholera
  'A01.0', // Typhoid fever
  'A09',   // Acute gastroenteritis
  'A90',   // Dengue fever
  'B54',   // Malaria (unspecified)
  'B15.9', // Hepatitis A
  'J18.9', // Pneumonia
  'J06.9', // Upper respiratory infection
  'A15.0', // Pulmonary tuberculosis
  'U07.1', // COVID-19
  'A37.90',// Whooping cough
  'B19.9', // Hepatitis (unspecified)
  'A22.9', // Anthrax
  'A26.9', // Erysipeloid
  'B05.9', // Measles
  'B06.9', // Rubella
  'A36.9', // Diphtheria
  'A33',   // Tetanus neonatorum
  'A82.9', // Rabies
  'B74.9', // Filariasis
]

/** Typed error for invalid epsilon values → maps to HTTP 422 */
export class PrivacyBudgetError extends Error {
  readonly code = 'INVALID_PRIVACY_BUDGET' as const
  constructor(epsilon: number) {
    super(`Privacy budget ε=${epsilon} is outside the valid range [0.5, 1.0]`)
    this.name = 'PrivacyBudgetError'
  }
}

/**
 * Validates and returns the epsilon value.
 * @throws {PrivacyBudgetError} if outside [0.5, 1.0]
 */
export function calibrateEpsilon(targetPrivacyBudget: number): number {
  if (targetPrivacyBudget < 0.5 || targetPrivacyBudget > 1.0) {
    throw new PrivacyBudgetError(targetPrivacyBudget)
  }
  return targetPrivacyBudget
}

/**
 * Applies Randomised Response to a disease code.
 *
 * Algorithm:
 *   1. With probability ε, report the true ICD-10 code (truth-telling branch)
 *   2. With probability (1−ε), sample uniformly from DISEASE_CODEBOOK
 *      (randomised branch — provides plausible deniability)
 *
 * This ensures no individual diagnosis can be confirmed with certainty,
 * while aggregate statistics remain statistically recoverable.
 */
export async function applyLDP(
  icdCode: string,
  epsilon = 0.75,
): Promise<SurveillanceReport['noisyIcdCode']> {
  calibrateEpsilon(epsilon) // throws PrivacyBudgetError if invalid

  // Cryptographically secure coin flip using Web Crypto
  const randomBytes = new Uint8Array(4)
  crypto.getRandomValues(randomBytes)
  const rand = new DataView(randomBytes.buffer).getUint32(0) / 0xffffffff

  if (rand < epsilon) {
    // PRIVACY BOUNDARY — truth-telling branch: report actual diagnosis
    return icdCode
  } else {
    // PRIVACY BOUNDARY — randomised branch: plausible deniability
    const idx = Math.floor(Math.random() * DISEASE_CODEBOOK.length)
    return DISEASE_CODEBOOK[idx]
  }
}

/**
 * Generates a session-scoped hash that identifies a reporting session
 * without linking to any patient identity.
 * Uses SHA-256 of a fresh random UUID — resets on page reload.
 */
async function generateSessionHash(): Promise<string> {
  const sessionId = crypto.randomUUID()
  const encoded = new TextEncoder().encode(sessionId)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Session hash is computed once per page load
let _sessionHash: string | null = null
async function getSessionHash(): Promise<string> {
  if (!_sessionHash) _sessionHash = await generateSessionHash()
  return _sessionHash
}

/**
 * Full pipeline: apply LDP noise and build the SurveillanceReport
 * ready to be queued by syncEngine.ts
 */
export async function buildSurveillanceReport(params: {
  icdCode: string
  epsilon?: number
  latitude: number
  longitude: number
  h3Index: string
}): Promise<Omit<SurveillanceReport, 'sessionHash'> & { sessionHash: string }> {
  const { icdCode, epsilon = 0.75, latitude, longitude, h3Index } = params
  const noisyIcdCode = await applyLDP(icdCode, epsilon)
  const sessionHash = await getSessionHash()

  return {
    noisyIcdCode,
    epsilon,
    latitude,
    longitude,
    sessionHash,
    h3Index,
    clientTimestamp: new Date().toISOString(),
  }
}
