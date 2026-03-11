// ============================================================
// src/lib/db.ts
// Dexie.js (IndexedDB) schema for local-first offline storage
// ============================================================

import Dexie, { type Table } from 'dexie'
import type { ClinicalRecord, SurveillanceReport } from '../types'

// ── Extended types for local storage ─────────────────────────

export interface LocalBlindRecord extends ClinicalRecord {
  /** Local primary key — auto-generated UUID */
  localId: string
  /** Sync status with the backend */
  syncStatus: 'local' | 'synced' | 'failed'
  /** ISO timestamp of last sync attempt */
  lastSyncAttempt?: string
}

export interface PendingReport {
  /** Auto-increment primary key */
  id?: number
  /** The anonymised surveillance report ready to POST */
  report: SurveillanceReport
  /** Number of POST attempts (for exponential backoff) */
  attempts: number
  /** ISO timestamp of when this was queued */
  createdAt: string
  /**
   * Last error code from ApiErrorResponse.error.code.
   * 422/403 = permanent failure (do not retry)
   * 429/5xx = transient failure (retry with backoff)
   */
  lastError?: string
}

// ── Database class ───────────────────────────────────────────

export class OmniShieldDB extends Dexie {
  /**
   * Locally encrypted patient records (EncryptedBlob wrappers).
   * The encryption key is derived from the QR code and never stored here.
   */
  blindRecords!: Table<LocalBlindRecord>

  /**
   * Queue of LDP-anonymised surveillance reports waiting to be
   * POSTed to /api/v1/surveillance/report.
   * Items are added offline and drained by the SyncEngine.
   */
  pendingReports!: Table<PendingReport>

  // New stores for v2.0
  authTokens!: Table<{ id?: number; token: string; userId: string; role: string; expiresAt: string; storedAt: string }>
  carePathway!: Table<{ id?: number; abhaId: string; facilityName: string; facilityType: string; visitType: string; icdCode?: string; geoLat?: number; geoLon?: number; visitedAt: string; synced: boolean }>
  healthcareEvents!: Table<{ id?: number; eventId: string; eventType: string; payload: any; sourceFacility: string; severity: string; createdAt: string }>
  fhirResources!: Table<{ id?: number; resourceId: string; resourceType: string; resource: any; cachedAt: string }>
  cdssResults!: Table<{ id?: number; analyzedAt: string; symptoms: string[]; diagnoses: any[]; interactions: any[]; tests: any[] }>
  epidemicSimulations!: Table<{ id?: number; model: string; params: any; series: any[]; peakDay: number; simulatedAt: string }>

  constructor() {
    super('OmniShieldDB')

    this.version(1).stores({
      blindRecords:   'localId, syncStatus, [id+syncStatus]',
      pendingReports: '++id, createdAt, attempts, lastError',
    })

    this.version(2).stores({
      blindRecords:          'localId, syncStatus, [id+syncStatus]',
      pendingReports:        '++id, createdAt, attempts, lastError',
      authTokens:            '++id, userId, role',
      carePathway:           '++id, abhaId, visitedAt, synced',
      healthcareEvents:      '++id, eventId, eventType, severity, createdAt',
      fhirResources:         '++id, resourceId, resourceType, cachedAt',
      cdssResults:           '++id, analyzedAt',
      epidemicSimulations:   '++id, model, simulatedAt',
    })
  }
}

// Singleton instance
export const db = new OmniShieldDB()
