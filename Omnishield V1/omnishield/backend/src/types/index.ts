// ============================================================
// src/types/index.ts — Shared backend types
// ============================================================

export interface SurveillanceReportBody {
  noisyIcdCode: string
  epsilon: number
  latitude: number
  longitude: number
  sessionHash: string
  h3Index: string
  clientTimestamp: string
}

export interface ClusterRow {
  cluster_id: number
  centroid_lon: number
  centroid_lat: number
  case_count: number
  dominant_icd: string
  severity_level: 'MODERATE' | 'HIGH' | 'CRITICAL'
  last_updated: string
}

export interface StatsRow {
  total_reports: string
  active_clusters: string
  critical_clusters: string
  last_24h_reports: string
}

// ── Custom typed errors → mapped to HTTP codes by errorHandler ─

export class PrivacyBudgetError extends Error {
  readonly code = 'INVALID_PRIVACY_BUDGET' as const
  readonly httpStatus = 422 as const
  constructor(epsilon: number) {
    super(`epsilon ${epsilon} outside valid range [0.5, 1.0]`)
    this.name = 'PrivacyBudgetError'
  }
}

export class KeySignatureMismatchError extends Error {
  readonly code = 'KEY_SIGNATURE_MISMATCH' as const
  readonly httpStatus = 403 as const
  constructor() {
    super('QR payload failed cryptographic validation')
    this.name = 'KeySignatureMismatchError'
  }
}

export class InvalidCoordinatesError extends Error {
  readonly code = 'INVALID_COORDINATES' as const
  readonly httpStatus = 400 as const
  constructor(lat: number, lon: number) {
    super(`Coordinates (${lat}, ${lon}) are outside valid WGS84 bounds`)
    this.name = 'InvalidCoordinatesError'
  }
}

export class RateLimitError extends Error {
  readonly code = 'RATE_LIMIT_EXCEEDED' as const
  readonly httpStatus = 429 as const
  constructor() {
    super('Rate limit exceeded — try again later')
    this.name = 'RateLimitError'
  }
}
