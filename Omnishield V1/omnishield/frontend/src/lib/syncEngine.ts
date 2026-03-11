// ============================================================
// src/lib/syncEngine.ts
// Stale-While-Revalidate offline sync with Background Sync API
// ============================================================

import { db } from './db'
import type { SurveillanceReport, ApiErrorResponse } from '../types'

const REPORT_ENDPOINT = '/api/v1/surveillance/report'
const SYNC_TAG = 'omnishield-report-sync'

export interface SyncResult {
  succeeded: number
  failed: number   // transient — will be retried
  permanent: number // 422/403 — removed from queue permanently
}

// ── Exponential backoff ──────────────────────────────────────

function backoffMs(attempts: number): number {
  return Math.min(2 ** attempts * 1_000, 30_000) // max 30s
}

// ── Main SyncEngine class ────────────────────────────────────

export class SyncEngine {
  /**
   * Queues a surveillance report for sending.
   *
   * Strategy (Stale-Write-Then-Sync):
   *   1. Always write to Dexie immediately (stale write = offline safety)
   *   2. If online, attempt immediate POST
   *   3. On success (201): remove from queue
   *   4. On permanent error (422/403): remove, surface to UI
   *   5. On transient error (429/5xx/network): keep, schedule retry
   *   6. If offline: register Background Sync
   */
  async queueReport(report: SurveillanceReport): Promise<void> {
    // Stale write — persists even if the tab closes before sync
    const id = await db.pendingReports.add({
      report,
      attempts: 0,
      createdAt: new Date().toISOString(),
    })

    if (navigator.onLine) {
      await this._tryPost(id, report)
    } else {
      // Register Background Sync so the SW drains the queue when online
      await this._registerBackgroundSync()
    }
  }

  /**
   * Drains the pending queue FIFO.
   * Called by the Service Worker on 'sync' event with tag SYNC_TAG.
   * Re-throws on transient errors so the SW can reschedule.
   */
  async drainQueue(): Promise<SyncResult> {
    const result: SyncResult = { succeeded: 0, failed: 0, permanent: 0 }
    const pending = await db.pendingReports.orderBy('id').toArray()

    for (const item of pending) {
      try {
        const res = await fetch(REPORT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.report),
        })

        if (res.status === 201) {
          await db.pendingReports.delete(item.id!)
          result.succeeded++
          this._notifyMainThread()
        } else if (res.status === 422 || res.status === 403) {
          // Permanent client error — do not retry
          const body: ApiErrorResponse = await res.json()
          console.warn('[SyncEngine] Permanent failure:', body.error.code)
          await db.pendingReports.delete(item.id!)
          result.permanent++
          this._dispatchError(body.error.code, res.status)
        } else {
          // Transient — increment attempts and keep
          await db.pendingReports.update(item.id!, {
            attempts: item.attempts + 1,
            lastError: `HTTP_${res.status}`,
          })
          result.failed++
          // Re-throw so the SW knows to reschedule Background Sync
          throw new Error(`Transient HTTP ${res.status}`)
        }
      } catch (err) {
        if (!(err instanceof Error && err.message.startsWith('Transient'))) {
          // Network error
          await db.pendingReports.update(item.id!, {
            attempts: item.attempts + 1,
            lastError: 'NETWORK_ERROR',
          })
          result.failed++
          throw err // SW reschedules
        }
        throw err
      }
    }

    return result
  }

  /** Returns the number of pending reports for the UI badge */
  async getQueueDepth(): Promise<number> {
    return db.pendingReports.count()
  }

  // ── Private helpers ────────────────────────────────────────

  private async _tryPost(id: number, report: SurveillanceReport): Promise<void> {
    try {
      const res = await fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      })

      if (res.status === 201) {
        await db.pendingReports.delete(id)
        this._notifyMainThread()
      } else if (res.status === 422 || res.status === 403) {
        const body: ApiErrorResponse = await res.json()
        await db.pendingReports.delete(id)
        this._dispatchError(body.error.code, res.status)
      } else {
        // Transient — keep in queue with backoff
        const item = await db.pendingReports.get(id)
        if (item) {
          setTimeout(
            () => this._tryPost(id, report),
            backoffMs(item.attempts + 1),
          )
          await db.pendingReports.update(id, { attempts: item.attempts + 1 })
        }
      }
    } catch {
      // Network error — register Background Sync as fallback
      await this._registerBackgroundSync()
    }
  }

  private async _registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready
      // @ts-ignore — SyncManager types not always available
      await reg.sync.register(SYNC_TAG)
    }
  }

  /** Tell the main thread to update the queue badge */
  private _notifyMainThread(): void {
    navigator.serviceWorker?.controller?.postMessage({
      type: 'QUEUE_DEPTH_UPDATE',
    })
  }

  /** Dispatch a custom event so UI modals can react */
  private _dispatchError(
    code: ApiErrorResponse['error']['code'],
    status: number,
  ): void {
    window.dispatchEvent(
      new CustomEvent('omnishield:sync-error', { detail: { code, status } }),
    )
  }
}

export const syncEngine = new SyncEngine()
