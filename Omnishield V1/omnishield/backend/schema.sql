-- ============================================================
-- schema.sql — OmniShield PostgreSQL + PostGIS Database Schema
-- Run: psql -U omnishield -d omnishield_db -f schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- uuid_generate_v4() fallback

-- ── Table: blind_records ─────────────────────────────────────
-- Stores AES-GCM-256 encrypted patient blobs.
-- The server NEVER has the decryption key — it lives only in
-- the patient's browser, derived from their QR code.
CREATE TABLE IF NOT EXISTS blind_records (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- AES-GCM-256 encrypted ClinicalRecord (FHIR R4 Patient/Observation)
  -- Shape: { iv: string, ciphertext: string, authTag: 'AES-GCM-256', schemaVersion: string }
  encrypted_blob  JSONB       NOT NULL,

  -- SHA-256 of the ciphertext — used for deduplication without decryption
  record_hash     TEXT        UNIQUE NOT NULL,

  -- H3 hex cell at resolution 9 (~174m radius) — spatial bucketing
  -- without storing exact coordinates
  geo_cell        TEXT,

  schema_version  VARCHAR(5)  NOT NULL DEFAULT '1.0',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE blind_records IS
  'Server-blind encrypted patient records. The decryption key never reaches the server.';
COMMENT ON COLUMN blind_records.record_hash IS
  'SHA-256 of ciphertext only — enables deduplication without decryption.';
COMMENT ON COLUMN blind_records.geo_cell IS
  'H3 index at resolution 9 — approximate spatial cell, not exact coordinates.';


-- ── Table: surveillance_reports ──────────────────────────────
-- Stores LDP-anonymised disease reports.
-- Coordinates have been fuzzed twice: once client-side (LDP randomised response
-- on the ICD code) and once server-side (Laplace noise on coordinates).
CREATE TABLE IF NOT EXISTS surveillance_reports (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ICD-10 code AFTER Randomised Response LDP (ε=0.75)
  -- May not be the patient's true diagnosis — by design
  noisy_icd_code    VARCHAR(10) NOT NULL,

  -- Privacy budget used (validated: must be in [0.5, 1.0])
  epsilon           DECIMAL(3,2) NOT NULL DEFAULT 0.75
                    CHECK (epsilon BETWEEN 0.5 AND 1.0),

  -- Fuzzed PostGIS point (server added ±0.001° Laplace noise)
  -- PRIVACY BOUNDARY — exact patient location is never stored
  reported_location GEOMETRY(Point, 4326) NOT NULL,

  -- H3 index at resolution 9 for fast spatial aggregation
  h3_index          TEXT,

  -- SHA-256 of session-scoped random UUID — no PII
  session_hash      TEXT        NOT NULL,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE surveillance_reports IS
  'LDP-anonymised surveillance reports. ICD codes randomised (ε=0.75), coordinates fuzzed.';

-- Spatial index for DBSCAN and tile queries
CREATE INDEX IF NOT EXISTS idx_surveillance_geo
  ON surveillance_reports USING GIST(reported_location);

-- Composite index for ICD code time-series queries
CREATE INDEX IF NOT EXISTS idx_surveillance_icd_time
  ON surveillance_reports(noisy_icd_code, created_at DESC);

-- Index for 72-hour DBSCAN window
CREATE INDEX IF NOT EXISTS idx_surveillance_created
  ON surveillance_reports(created_at DESC);


-- ── Table: cluster_cache ─────────────────────────────────────
-- Materialised DBSCAN cluster results.
-- Updated in real-time by the trigger after each INSERT.
CREATE TABLE IF NOT EXISTS cluster_cache (
  cluster_id      SERIAL      PRIMARY KEY,
  centroid        GEOMETRY(Point, 4326),
  case_count      INT         NOT NULL DEFAULT 0,
  dominant_icd    TEXT,

  -- Severity classification:
  --   case_count >= 20 → CRITICAL
  --   case_count >= 10 → HIGH
  --   case_count >= 5  → MODERATE
  severity_level  TEXT        NOT NULL DEFAULT 'MODERATE'
                  CHECK (severity_level IN ('MODERATE', 'HIGH', 'CRITICAL')),

  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cluster_cache IS
  'Materialised DBSCAN cluster results. Refreshed by trigger after each surveillance_reports INSERT.';


-- ── Function: fn_detect_and_update_clusters ──────────────────
-- PL/pgSQL function invoked by the trigger below.
-- Runs ST_ClusterDBSCAN over the last 72 hours of reports,
-- classifies severity, and upserts cluster_cache.
-- Also fires pg_notify for real-time WebSocket push.
CREATE OR REPLACE FUNCTION fn_detect_and_update_clusters()
RETURNS TRIGGER AS $$
DECLARE
  v_cluster       RECORD;
  v_severity      TEXT;
  v_dominant_icd  TEXT;
BEGIN
  -- Truncate and rebuild cluster_cache for the 72-hour window
  -- (In production, consider incrementally updating only affected clusters)
  DELETE FROM cluster_cache;

  INSERT INTO cluster_cache (centroid, case_count, dominant_icd, severity_level, last_updated)
  SELECT
    ST_Centroid(ST_Collect(reported_location))  AS centroid,
    COUNT(*)                                    AS case_count,
    MODE() WITHIN GROUP (ORDER BY noisy_icd_code) AS dominant_icd,
    CASE
      WHEN COUNT(*) >= 20 THEN 'CRITICAL'
      WHEN COUNT(*) >= 10 THEN 'HIGH'
      ELSE                     'MODERATE'
    END                                         AS severity_level,
    NOW()                                       AS last_updated
  FROM (
    SELECT
      reported_location,
      noisy_icd_code,
      -- DBSCAN: eps=0.005 degrees (~500m), minPoints=5
      ST_ClusterDBSCAN(reported_location, eps := 0.005, minPoints := 5)
        OVER ()                                 AS cluster_label
    FROM surveillance_reports
    WHERE created_at > NOW() - INTERVAL '72 hours'
  ) clustered
  WHERE cluster_label IS NOT NULL   -- NULL = noise points (below minPoints density)
  GROUP BY cluster_label;

  -- Fire pg_notify for each new/updated cluster → WebSocket broadcast
  FOR v_cluster IN SELECT * FROM cluster_cache LOOP
    PERFORM pg_notify(
      'cluster_update',
      json_build_object(
        'type',         'Feature',
        'geometry',     json_build_object(
                          'type',        'Point',
                          'coordinates', ARRAY[
                            ST_X(v_cluster.centroid),
                            ST_Y(v_cluster.centroid)
                          ]
                        ),
        'properties',   json_build_object(
                          'clusterId',     v_cluster.cluster_id,
                          'caseCount',     v_cluster.case_count,
                          'dominantIcd',   v_cluster.dominant_icd,
                          'severityLevel', v_cluster.severity_level,
                          'lastUpdated',   v_cluster.last_updated
                        )
      )::text
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_detect_and_update_clusters IS
  'Rebuilds cluster_cache using ST_ClusterDBSCAN (eps=0.005, minPoints=5) over 72h window.
   Fires pg_notify for each cluster to push real-time updates via WebSocket.';


-- ── Trigger: trg_realtime_cluster_detection ──────────────────
-- Fires after every INSERT on surveillance_reports.
-- Runs asynchronously (AFTER, per row) to avoid blocking the INSERT.
DROP TRIGGER IF EXISTS trg_realtime_cluster_detection ON surveillance_reports;

CREATE TRIGGER trg_realtime_cluster_detection
  AFTER INSERT ON surveillance_reports
  FOR EACH ROW
  EXECUTE FUNCTION fn_detect_and_update_clusters();

COMMENT ON TRIGGER trg_realtime_cluster_detection ON surveillance_reports IS
  'Real-time DBSCAN cluster detection. Fires after each new surveillance report.';


-- ── Indexes for cluster_cache ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cluster_severity
  ON cluster_cache(severity_level);

CREATE INDEX IF NOT EXISTS idx_cluster_centroid
  ON cluster_cache USING GIST(centroid);


-- ── Helper view: active_high_risk_clusters ────────────────────
CREATE OR REPLACE VIEW active_high_risk_clusters AS
  SELECT
    cluster_id,
    ST_X(centroid) AS longitude,
    ST_Y(centroid) AS latitude,
    case_count,
    dominant_icd,
    severity_level,
    last_updated
  FROM cluster_cache
  WHERE severity_level IN ('HIGH', 'CRITICAL')
  ORDER BY case_count DESC;

COMMENT ON VIEW active_high_risk_clusters IS
  'Convenience view for HIGH and CRITICAL clusters — used by the Authority Dashboard.';
