// ============================================================
// src/types/index.ts — Shared backend types — OmniShield v2.0
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

export interface UserRow {
  id: string
  email: string
  password_hash: string
  full_name: string
  role: 'doctor' | 'nurse' | 'lab_tech' | 'pharmacist' | 'admin' | 'authority'
  mfa_secret?: string
  is_active: boolean
  created_at: Date
}

export interface AuditLogRow {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  ip_address?: string
  user_agent?: string
  created_at: Date
}

export interface AbhaCardRow {
  id: string
  abha_id: string
  patient_name: string
  dob: string
  gender: string
  linked_qr_hash?: string
  geo_access_logs: any
  created_at: Date
}

export interface CarePathwayRow {
  id: string
  abha_id: string
  facility_name: string
  facility_type: 'gov' | 'private'
  visit_type: string
  icd_code?: string
  provider_role: string
  geo_lat?: number
  geo_lon?: number
  notes_encrypted?: string
  visited_at: Date
}

export interface PrivacyBudgetRow {
  id: string
  total_budget: number
  spent: number
  query_count: number
  last_query_at?: Date
  created_at: Date
}

export interface HealthcareEventRow {
  id: string
  event_type: string
  payload: any
  source_facility: string
  geo_lat?: number
  geo_lon?: number
  severity: string
  created_at: Date
}

export interface FederatedUpdateRow {
  id: string
  hospital_id: string
  round_number: number
  encrypted_weights: any
  metrics: any
  submitted_at: Date
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

export class UnauthorizedError extends Error {
  readonly code = 'UNAUTHORIZED' as const
  readonly httpStatus = 401 as const
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN' as const
  readonly httpStatus = 403 as const
  constructor(message = 'Insufficient permissions') {
    super(message)
    this.name = 'ForbiddenError'
  }
}
