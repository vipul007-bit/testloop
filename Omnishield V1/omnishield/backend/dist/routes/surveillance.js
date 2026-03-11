"use strict";
// ============================================================
// src/routes/surveillance.ts
// POST /report · GET /tiles/:z/:x/:y.mvt · GET /stats
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const h3_js_1 = require("h3-js");
const knex_1 = __importDefault(require("../db/knex"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// ── Zod validation schema ────────────────────────────────────
const ReportSchema = zod_1.z.object({
    noisyIcdCode: zod_1.z.string().regex(/^[A-Z][0-9]{2}(\.[0-9]{0,4})?$/, 'Invalid ICD-10 format'),
    epsilon: zod_1.z.number().min(0.5).max(1.0),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    sessionHash: zod_1.z.string().length(64).regex(/^[0-9a-f]{64}$/, 'Must be 64-char hex SHA-256'),
    h3Index: zod_1.z.string().min(10).max(20),
    clientTimestamp: zod_1.z.string().datetime(),
});
// ── Coordinate fuzzing (Laplace noise) ──────────────────────
function laplaceFuzz(value, magnitude) {
    // Laplace noise: draw from exponential, randomise sign
    const u = Math.random() - 0.5;
    const noise = -magnitude * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return value + noise;
}
// ── POST /api/v1/surveillance/report ─────────────────────────
router.post('/report', rateLimiter_1.reportRateLimiter, async (req, res, next) => {
    try {
        // 1. Validate request body
        const parsed = ReportSchema.safeParse(req.body);
        if (!parsed.success) {
            // Check specifically for epsilon violation → 422
            const epsilonIssue = parsed.error.issues.find(i => i.path.includes('epsilon'));
            if (epsilonIssue)
                throw new types_1.PrivacyBudgetError(req.body.epsilon ?? 0);
            // Coordinate issue → 400
            const coordIssue = parsed.error.issues.find(i => i.path.includes('latitude') || i.path.includes('longitude'));
            if (coordIssue)
                throw new types_1.InvalidCoordinatesError(req.body.latitude, req.body.longitude);
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } });
        }
        const data = parsed.data;
        // 2. Double-validate epsilon server-side
        if (data.epsilon < 0.5 || data.epsilon > 1.0) {
            throw new types_1.PrivacyBudgetError(data.epsilon);
        }
        // 3. Server-side coordinate fuzz (double-blind privacy)
        // PRIVACY BOUNDARY — we add additional Laplace noise before storage
        const fuzzMagnitude = parseFloat(process.env.COORDINATE_FUZZ_DEGREES ?? '0.001');
        const fuzzedLat = laplaceFuzz(data.latitude, fuzzMagnitude);
        const fuzzedLon = laplaceFuzz(data.longitude, fuzzMagnitude);
        // 4. Compute (and verify) H3 index at resolution 9
        const serverH3 = (0, h3_js_1.latLngToCell)(fuzzedLat, fuzzedLon, 9);
        // 5. Insert in a transaction
        await knex_1.default.transaction(async (trx) => {
            await trx('surveillance_reports').insert({
                noisy_icd_code: data.noisyIcdCode,
                epsilon: data.epsilon,
                // PostGIS point — fuzzed coordinates
                reported_location: knex_1.default.raw('ST_SetSRID(ST_MakePoint(?, ?), 4326)', [fuzzedLon, fuzzedLat]),
                h3_index: serverH3,
                session_hash: data.sessionHash,
                // The DB trigger fn_detect_and_update_clusters fires after this insert
            });
        });
        // PRIVACY BOUNDARY — never echo coordinates back to the client
        res.status(201).json({
            accepted: true,
            privacyBudgetUsed: data.epsilon,
        });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/v1/surveillance/tiles/:z/:x/:y.mvt ──────────────
router.get('/tiles/:z/:x/:y.mvt', async (req, res, next) => {
    try {
        const z = parseInt(req.params.z, 10);
        const x = parseInt(req.params.x, 10);
        const y = parseInt(req.params.y, 10);
        // Zoom-level severity filter
        let severityFilter;
        if (z < 8)
            severityFilter = ['CRITICAL'];
        else if (z < 10)
            severityFilter = ['CRITICAL', 'HIGH'];
        else
            severityFilter = ['CRITICAL', 'HIGH', 'MODERATE'];
        // Build MVT tile using ST_AsMVT + ST_AsMVTGeom
        const result = await knex_1.default.raw(`
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
    `, [z, x, y, severityFilter]);
        const tile = result.rows[0]?.tile;
        if (!tile || tile.length === 0) {
            return res.status(204).end();
        }
        res.set({
            'Content-Type': 'application/x-protobuf',
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*',
        });
        res.send(tile);
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/v1/surveillance/stats ───────────────────────────
router.get('/stats', async (_req, res, next) => {
    try {
        const [statsRow, topIcd] = await Promise.all([
            knex_1.default.raw(`
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
            (0, knex_1.default)('surveillance_reports')
                .select('noisy_icd_code as code')
                .count('* as count')
                .groupBy('noisy_icd_code')
                .orderBy('count', 'desc')
                .limit(5),
        ]);
        const row = statsRow.rows[0];
        res.json({
            totalReports: row.total_reports,
            activeClusters: row.active_clusters,
            criticalClusters: row.critical_clusters,
            last24hReports: row.last_24h_reports,
            topIcdCodes: topIcd.map(r => ({ code: r.code, count: Number(r.count) })),
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=surveillance.js.map