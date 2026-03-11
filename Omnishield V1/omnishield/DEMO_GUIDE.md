# OmniShield — Mentor Demo Cheat Sheet
# Keep this open during the presentation

## SETUP (do before the meeting)
cd omnishield
cd frontend && npm install && npm run dev    # Terminal 1 → localhost:5173
cd backend  && npm install && npm run dev    # Terminal 2 → localhost:3001
pip install scikit-learn numpy               # once

## DEMO 1 — Scan + Diagnose + Immediate History Update
Open: http://localhost:5173 on laptop or phone
Role: Doctor (default)
Steps:
  1. Click "Scan Patient QR"
  2. Click "Confirm Scan ✓" (or scan real QR at /patient-qr.html)
  3. Select "A90 – Dengue fever"
  4. Type any prescription
  5. GPS shows real lat/lon (or Mumbai fallback)
  6. Click "Save & Sync Diagnosis"
  SHOW: new row appears INSTANTLY at top of history
  SHOW: toast "saved & synced"

## DEMO 2 — Offline Flow
Steps:
  1. DevTools (F12) → Network tab → select "Offline" in dropdown
  2. SHOW: navbar turns red "Offline"
  3. Log another diagnosis → Save
  4. SHOW: toast "Offline — queued (1 pending)"
  5. SHOW: yellow banner "1 report queued in IndexedDB"
  6. DevTools → Network → select "No throttling" (back online)
  7. SHOW: toast "Back online — syncing…" fires automatically
  8. SHOW: toast "✓ 1 report synced to backend"
  KEY POINT: No data loss even if offline for hours

## DEMO 3 — DBSCAN Hotspots
Terminal:
  python3 backend/dbscan_demo.py
  SHOW: 5 clusters found, severity, JSON output, DP analytics table

UI:
  1. Switch to Authority role
  2. Overview tab → click "DBSCAN" button above map
  3. SHOW: pulsing rings (red=CRITICAL, orange=HIGH, yellow=MODERATE)
  4. Click "DBSCAN Hotspots" tab
  5. SHOW: cluster list + Python code preview card

KEY PHRASES:
  "sklearn DBSCAN with eps=500m, minPoints=5 — same params as our PostGIS trigger"
  "In production this runs automatically on every INSERT via a PostgreSQL trigger"

## DEMO 4 — Differential Privacy
  1. Authority → "DP Analytics" tab
  2. SHOW: Admin column (exact: 312 Dengue, 198 Typhoid)
  3. SHOW: Public column (noised counts, Δ column)
  4. Drag ε slider to 0.1 → click Re-noise
  5. SHOW: huge noise (Dengue 312 → maybe 280 or 360)
  6. Drag ε to 0.75 → Re-noise
  7. SHOW: small noise (close to real count)

KEY PHRASES:
  "Privacy budget ε controls the tradeoff: lower ε = stronger privacy = more noise"
  "The public API only ever returns the noised counts — exact counts never leave the admin view"
  "Formula: noised = exact + Laplace(0, sensitivity/ε) — textbook ε-differential privacy"

## AI CHATBOT
  Doctor mode: click blue bot FAB (bottom right)
  Type: "Patient has fever 39°C, low platelets, rash — possible dengue?"
  SHOW: Claude responds with ICD-10 suggestions and treatment protocol
  NOTE: chatbot is aware of sulfonamide allergy and flags it automatically

## GITHUB TAG
  bash setup_github.sh
  (then push as printed)
  Tag: git tag v0.1  →  github.com/YOUR_USERNAME/omnishield/releases/tag/v0.1

## TALKING POINTS
- "Zero-knowledge: our server stores AES-GCM-256 blobs — decryption key derived from patient QR, never sent to server"
- "Local-first: diagnosis saved to IndexedDB in <10ms even offline, syncs when online"
- "Double privacy: LDP randomises the ICD code client-side, Laplace noise on coordinates server-side"
- "Real-time: PostgreSQL trigger runs DBSCAN after every INSERT and fires pg_notify → WebSocket push"
- "India-specific: 131-point geographic SVG outline, Indian hospital data, ICD-10 codes for endemic diseases"
