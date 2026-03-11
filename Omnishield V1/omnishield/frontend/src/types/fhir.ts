// ============================================================
// types/fhir.ts — FHIR R4-aligned data contracts for OmniShield
// All interfaces follow simplified FHIR R4 Patient/Observation schema
// ============================================================

/** ICD-10 coding system reference */
export interface FHIRCoding {
  /** Always ICD-10 in this system */
  system: 'http://hl7.org/fhir/sid/icd-10'
  /** e.g. "J18.9" */
  code: string
  /** e.g. "Pneumonia, unspecified" */
  display: string
}

/** A single clinical observation/visit */
export interface FHIRObservation {
  resourceType: 'Observation'
  /** preliminary = unconfirmed, final = confirmed, amended = corrected */
  status: 'preliminary' | 'final' | 'amended'
  code: { coding: FHIRCoding[] }
  /** ISO 8601 datetime of the observation */
  effectiveDateTime: string
  /** Optional free-text clinical note — stored encrypted */
  valueString?: string
}

/**
 * Core patient record — plaintext structure encrypted by cryptoVault.ts
 * before leaving the browser. Never sent to server in plaintext.
 */
export interface ClinicalRecord {
  resourceType: 'Patient'
  /** Client-generated UUIDv4 — never sent to server */
  id: string
  gender: 'male' | 'female' | 'other' | 'unknown'
  /** Year only — no full DOB to limit PII */
  birthDate: string
  observations: FHIRObservation[]
  meta: {
    localCreatedAt: string
    schemaVersion: '1.0'
    // PRIVACY BOUNDARY — fields below are stripped before any network operation
    /** base58-encoded salt used to derive the AES-GCM-256 encryption key */
    qrSalt: string
  }
}

/**
 * Post-LDP anonymised object POSTed to /api/v1/surveillance/report
 * The noisyIcdCode has been randomised via Randomised Response (ε=0.75)
 */
export interface SurveillanceReport {
  /** ICD-10 code after Local Differential Privacy noise injection */
  noisyIcdCode: string
  /** Privacy budget used — must be in [0.5, 1.0] */
  epsilon: number
  /** WGS84 latitude — will be fuzzed server-side before storage */
  latitude: number
  /** WGS84 longitude — will be fuzzed server-side before storage */
  longitude: number
  /** SHA-256 of a session-scoped random UUID — no PII */
  sessionHash: string
  /** H3 index at resolution 9 (computed client-side, verified server-side) */
  h3Index: string
  /** ISO 8601 client-side timestamp */
  clientTimestamp: string
}

/**
 * Encrypted envelope stored in the blind_records table.
 * The decryption key is derived from the patient QR and never leaves the browser.
 */
export interface EncryptedBlob {
  /** Base64-encoded 12-byte AES-GCM IV */
  iv: string
  /** Base64-encoded AES-GCM-256 ciphertext */
  ciphertext: string
  authTag: 'AES-GCM-256'
  schemaVersion: string
}

/** GeoJSON Feature returned from WebSocket and MVT tile metadata */
export interface ClusterFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    clusterId: number
    caseCount: number
    dominantIcd: string
    severityLevel: 'MODERATE' | 'HIGH' | 'CRITICAL'
    lastUpdated: string
  }
}

/** Standard API error shape — maps to specific HTTP codes */
export interface ApiErrorResponse {
  error: {
    code:
      | 'INVALID_PRIVACY_BUDGET'    // 422 — epsilon outside [0.5, 1.0]
      | 'KEY_SIGNATURE_MISMATCH'    // 403 — QR payload failed crypto validation
      | 'RATE_LIMIT_EXCEEDED'       // 429 — too many reports from this IP
      | 'INVALID_COORDINATES'       // 400 — lat/lon outside WGS84 bounds
    message: string
    httpStatus: 422 | 403 | 429 | 400
  }
}

/** Stats summary returned by GET /api/v1/surveillance/stats */
export interface SurveillanceStats {
  totalReports: number
  activeClusters: number
  criticalClusters: number
  last24hReports: number
  topIcdCodes: Array<{ code: string; count: number }>
}
