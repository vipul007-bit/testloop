# 🛡️ OmniShield — Smart Healthcare Disease Surveillance PWA

> Zero-Knowledge · Local-First · PostGIS Outbreak Intelligence · Claude AI

---

## 🎯 Mentor Demo Flows (v0.1)

### Demo 1 — QR Scan → Diagnose → History Updates (30 min)
1. Open `http://localhost:5173` on mobile browser
2. Switch to **Doctor** role (default)
3. Click **Scan Patient QR** → real camera opens
4. Point at any QR code (or click **Confirm Scan ✓** for demo)
5. Patient profile: Priya Nair, IN-MH-2024-04812
6. Select **A90 – Dengue fever**, fill prescription + notes
7. GPS toggle ON → real coordinates from `navigator.geolocation`
8. Click **Save & Sync Diagnosis**
9. ✅ New entry appears **immediately** at top of Medical History
10. ✅ Toast: "Diagnosis saved & synced to backend"

### Demo 2 — Offline → Log → Reconnect → Auto-Sync (20 min)
1. DevTools → Network → **Offline**
2. Navbar shows red **Offline** badge
3. Log a diagnosis → Save
4. ✅ Toast: "Offline — queued (1 pending)"
5. ✅ Banner: "1 report queued in IndexedDB"
6. DevTools → Network → **Online**
7. ✅ Toast auto-fires: "Back online — syncing…"
8. ✅ Toast: "✓ 1 report synced to backend"

### Demo 3 — DBSCAN Hotspot Detection (30 min)
```bash
cd backend
pip install scikit-learn numpy
python3 dbscan_demo.py
# → 5 clusters, severity levels, JSON output, DP demo
```
In the UI: Authority role → **DBSCAN Hotspots** tab → pulsing rings on India map

### Demo 4 — Differential Privacy in Action (20 min)
Authority role → **DP Analytics** tab:
- Left: Admin — exact counts (312 Dengue, 198 Typhoid…)
- Right: Public — Laplace-noised counts + Δ column
- Drag **ε slider**: low ε = strong privacy = more noise
- Hit **Re-noise** to regenerate fresh noise

---

## Quick Start

### Database
```bash
psql -U postgres -c "CREATE USER omnishield WITH PASSWORD 'password';"
psql -U postgres -c "CREATE DATABASE omnishield_db OWNER omnishield;"
psql -U postgres -d omnishield_db -c "CREATE EXTENSION postgis;"
psql -U omnishield -d omnishield_db -f backend/schema.sql
```

### Backend
```bash
cd backend && cp .env.example .env
npm install && npm run dev      # → http://localhost:3001
```

### Frontend
```bash
cd frontend && npm install && npm run dev   # → http://localhost:5173
```

### Python DBSCAN (no DB needed)
```bash
pip install scikit-learn numpy
python3 backend/dbscan_demo.py
```

### GitHub + v0.1 tag
```bash
bash setup_github.sh
git remote add origin https://github.com/YOUR_USERNAME/omnishield.git
git push -u origin main && git push origin v0.1
```

---

## Architecture

```
omnishield/
├── frontend/src/
│   ├── App.jsx              ← All screens + India SVG map + chatbot
│   ├── lib/privacyEngine.ts ← LDP Randomised Response ε=0.75
│   ├── lib/cryptoVault.ts   ← AES-GCM-256 E2EE SubtleCrypto
│   ├── lib/db.ts            ← Dexie.js IndexedDB
│   └── lib/syncEngine.ts    ← Offline queue + Background Sync
├── backend/
│   ├── schema.sql           ← PostGIS DBSCAN trigger + pg_notify
│   ├── dbscan_demo.py       ← Standalone Python DBSCAN (30 mock rows)
│   └── src/routes/surveillance.ts ← POST /report · tiles · stats
├── setup_github.sh          ← git init + v0.1 tag
└── .github/workflows/ci.yml ← Frontend + backend + Python CI
```

## Privacy Architecture

| Layer | Mechanism | Guarantee |
|-------|-----------|-----------|
| Diagnosis | Randomised Response ε=0.75 | No individual diagnosis confirmable |
| Location (client) | H3 cell bucketing | No exact GPS stored |
| Location (server) | Laplace ±0.001° | Double-fuzzing before DB |
| Patient records | AES-GCM-256 SubtleCrypto | Server never has decryption key |
| Analytics | Laplace DP ε slider | Public counts anonymised |

## Features Checklist

| Feature | Status |
|---------|--------|
| Real camera QR scan | ✅ |
| Browser GPS geolocation | ✅ |
| Save → IndexedDB (offline-safe) | ✅ |
| Optimistic history update | ✅ |
| Real online/offline detection | ✅ |
| Auto-drain queue on reconnect | ✅ |
| DBSCAN pulsing hotspot map | ✅ |
| Python dbscan_demo.py | ✅ |
| DP Analytics admin vs public | ✅ |
| Laplace ε slider + Re-noise | ✅ |
| Claude AI chatbot (real API) | ✅ |
| Toast notification system | ✅ |
| Dark / light theme | ✅ |
| Precise India SVG map | ✅ |
| Background Sync PWA | ✅ |
| E2EE AES-GCM-256 | ✅ |
| GitHub CI workflow | ✅ |
| v0.1 tag script | ✅ |
