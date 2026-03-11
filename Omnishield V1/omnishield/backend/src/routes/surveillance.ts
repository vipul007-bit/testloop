// ============================================================
// src/routes/surveillance.ts
// POST /report · GET /tiles/:z/:x/:y.mvt · GET /stats
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { latLngToCell } from 'h3-js'
import knex from '../db/knex'
import { reportRateLimiter } from '../middleware/rateLimiter'
import {
  PrivacyBudgetError,
  InvalidCoordinatesError,
  type SurveillanceReportBody,
} from '../types'

const router = Router()

// ── Zod validation schema ────────────────────────────────────

const ReportSchema = z.object({
  noisyIcdCode:    z.string().regex(/^[A-Z][0-9]{2}(\.[0-9]{0,4})?$/, 'Invalid ICD-10 format'),
  epsilon:         z.number().min(0.5).max(1.0),
  latitude:        z.number().min(-90).max(90),
  longitude:       z.number().min(-180).max(180),
  sessionHash:     z.string().length(64).regex(/^[0-9a-f]{64}$/, 'Must be 64-char hex SHA-256'),
  h3Index:         z.string().min(10).max(20),
  clientTimestamp: z.string().datetime(),
})

// ── Coordinate fuzzing (Laplace noise) ──────────────────────

function laplaceFuzz(value: number, magnitude: number): number {
  // Laplace noise: draw from exponential, randomise sign
  const u = Math.random() - 0.5
  const noise = -magnitude * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
  return value + noise
}

// ── POST /api/v1/surveillance/report ─────────────────────────

router.post(
  '/report',
  reportRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validate request body
      const parsed = ReportSchema.safeParse(req.body)
      if (!parsed.success) {
        // Check specifically for epsilon violation → 422
        const epsilonIssue = parsed.error.issues.find(i => i.path.includes('epsilon'))
        if (epsilonIssue) throw new PrivacyBudgetError(req.body.epsilon ?? 0)
        // Coordinate issue → 400
        const coordIssue = parsed.error.issues.find(
          i => i.path.includes('latitude') || i.path.includes('longitude'),
        )
        if (coordIssue) throw new InvalidCoordinatesError(req.body.latitude, req.body.longitude)
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } })
      }

      const data: SurveillanceReportBody = parsed.data

      // 2. Double-validate epsilon server-side
      if (data.epsilon < 0.5 || data.epsilon > 1.0) {
        throw new PrivacyBudgetError(data.epsilon)
      }

      // 3. Server-side coordinate fuzz (double-blind privacy)
      // PRIVACY BOUNDARY — we add additional Laplace noise before storage
      const fuzzMagnitude = parseFloat(process.env.COORDINATE_FUZZ_DEGREES ?? '0.001')
      const fuzzedLat = laplaceFuzz(data.latitude, fuzzMagnitude)
      const fuzzedLon = laplaceFuzz(data.longitude, fuzzMagnitude)

      // 4. Compute (and verify) H3 index at resolution 9
      const serverH3 = latLngToCell(fuzzedLat, fuzzedLon, 9)

      // 5. Insert in a transaction
      await knex.transaction(async (trx) => {
        await trx('surveillance_reports').insert({
          noisy_icd_code:    data.noisyIcdCode,
          epsilon:           data.epsilon,
          // PostGIS point — fuzzed coordinates
          reported_location: knex.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [fuzzedLon, fuzzedLat]),
          h3_index:          serverH3,
          session_hash:      data.sessionHash,
          // The DB trigger fn_detect_and_update_clusters fires after this insert
        })
      })

      // PRIVACY BOUNDARY — never echo coordinates back to the client
      res.status(201).json({
        accepted: true,
        privacyBudgetUsed: data.epsilon,
      })
    } catch (err) {
      next(err)
    }
  },
)

// ── GET /api/v1/surveillance/tiles/:z/:x/:y.mvt ──────────────

router.get('/tiles/:z/:x/:y.mvt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const z = parseInt(req.params.z, 10)
    const x = parseInt(req.params.x, 10)
    const y = parseInt(req.params.y, 10)

    // Zoom-level severity filter
    let severityFilter: string[]
    if      (z < 8)  severityFilter = ['CRITICAL']
    else if (z < 10) severityFilter = ['CRITICAL', 'HIGH']
    else             severityFilter = ['CRITICAL', 'HIGH', 'MODERATE']

    // Build MVT tile using ST_AsMVT + ST_AsMVTGeom
    const result = await knex.raw(`
      WITH tile_bounds AS (
        SELECT ST_TileEnvelope(?, ?, ?) AS bounds
      ),
      cluster_data AS (
        SELECT
          cluster_id,
          case_count,
          dominant_icd,
          severity_level,
          last_updated,
          centroid
        FROM cluster_cache
        WHERE severity_level = ANY(?)
          AND ST_Intersects(centroid, (SELECT bounds FROM tile_bounds))
      ),
      mvt_data AS (
        SELECT
          ST_AsMVTGeom(
            centroid,
            (SELECT bounds FROM tile_bounds),
            4096, 64, true
          ) AS geom,
          cluster_id,
          case_count,
          dominant_icd,
          severity_level,
          last_updated
        FROM cluster_data
        WHERE ST_AsMVTGeom(centroid, (SELECT bounds FROM tile_bounds), 4096, 64, true) IS NOT NULL
      )
      SELECT ST_AsMVT(mvt_data.*, 'clusters', 4096, 'geom') AS tile
      FROM mvt_data
    `, [z, x, y, severityFilter])

    const tile = result.rows[0]?.tile
    if (!tile || tile.length === 0) {
      return res.status(204).end()
    }

    res.set({
      'Content-Type':  'application/x-protobuf',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    })
    res.send(tile)
  } catch (err) {
    next(err)
  }
})

// ── GET /api/v1/surveillance/stats ───────────────────────────

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [statsRow, topIcd] = await Promise.all([
      knex.raw(`
        SELECT
          COUNT(*)::int                                           AS total_reports,
          (SELECT COUNT(*)::int FROM cluster_cache)              AS active_clusters,
          (SELECT COUNT(*)::int FROM cluster_cache
           WHERE severity_level = 'CRITICAL')                   AS critical_clusters,
          COUNT(*) FILTER (
            WHERE created_at > NOW() - INTERVAL '24 hours'
          )::int                                                 AS last_24h_reports
        FROM surveillance_reports
      `),
      knex('surveillance_reports')
        .select('noisy_icd_code as code')
        .count('* as count')
        .groupBy('noisy_icd_code')
        .orderBy('count', 'desc')
        .limit(5),
    ])

    const row = statsRow.rows[0]
    res.json({
      totalReports:     row.total_reports,
      activeClusters:   row.active_clusters,
      criticalClusters: row.critical_clusters,
      last24hReports:   row.last_24h_reports,
      topIcdCodes:      topIcd.map(r => ({ code: r.code, count: Number(r.count) })),
    })
  } catch (err) {
    next(err)
  }
})

export default router
