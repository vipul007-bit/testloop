# 🎬 OmniShield v2.0 — Demo Guide

> Quick reference for the LOOP 24hr Hackathon demo presentation

---

## 🚦 What Works (Fully Functional)

### ✅ Authentication System
- Beautiful login page with split-panel design and OmniShield branding
- Multi-role selection (6 roles as clickable cards with icons)
- Email/password registration and login (in-memory store, demo mode)
- JWT access token (15min) + refresh token (7d)
- MFA toggle — any 6-digit code accepted in demo mode
- ABHA ID field for patient linking
- "Demo Login" quick-fill buttons for each role
- Dark/light theme toggle
- Error/success toast notifications
- Redirects to correct role dashboard after login

### ✅ Role-Specific Dashboards

| Dashboard | What to Demo |
|-----------|-------------|
| **Doctor** | CDSS AI recommendations with ICD-10 codes + confidence %, drug interaction alerts, prescription management, patient list |
| **Nurse** | Vitals logging form (BP, pulse, temp, SpO2, glucose), patient monitoring table with color-coded status, task queue |
| **Lab Tech** | Pending test orders, results entry form, completed history, DICOM viewer placeholder |
| **Pharmacist** | Prescription queue, drug interaction warnings (Warfarin + Aspirin HIGH risk), stock level indicators |
| **Admin** | System health (all green), user management table, audit log tail, recharts bed occupancy chart |
| **Authority** | SIR/SEIR epidemic curve (Recharts), district predictions, privacy budget ε meter, disease trends |

### ✅ SIR/SEIR Epidemic Models
- Euler integration of differential equations
- Adjustable parameters: population, R₀, gamma, sigma, days
- Returns time-series arrays for S, E, I, R curves
- District simulations for 5 Indian cities
- API: `GET /api/v1/epidemic/simulate?model=seir&population=1000000&infected=100`

### ✅ Adaptive Privacy Budget
- Tracks cumulative ε per session
- Default budget: ε = 5.0
- Blocks further queries when exhausted
- Compliance report generation
- API: `GET /api/v1/privacy/budget` (requires auth)

### ✅ FHIR R4 Interoperability
- Patient, Observation, DiagnosticReport, MedicationRequest resources
- Bundle creation
- In-memory storage (demo)
- API: `POST /api/v1/fhir/Patient`

### ✅ Real-Time Event Streaming (SSE)
- Server-Sent Events at `/api/v1/events/stream`
- Topics: patient.diagnosis, hospital.admission, lab.result, etc.
- Event history: `GET /api/v1/events/history`
- Publish: `POST /api/v1/events/publish`

### ✅ Federated Learning Simulation
- 3 simulated hospital nodes (Mumbai, Delhi, Bangalore)
- FedAvg aggregation per round
- Converging accuracy (improves ~2% per round)
- API: `POST /api/v1/federated/train`

### ✅ Clinical Decision Support (CDSS)
- 22 symptom → ICD-10 disease mappings
- 12 drug interaction pairs with severity levels
- NEWS2 early warning score calculation
- API: `POST /api/v1/cdss/analyze`

### ✅ Population Health Analytics
- Disease trend forecasting with exponential smoothing
- Seasonal outbreak predictions (3-month horizon)
- Hospital capacity forecasting
- Vaccination impact analysis
- API: `GET /api/v1/analytics/disease-trends?icdCode=J11&days=90`

### ✅ Security & Compliance
- JWT RBAC on protected routes
- Audit log ring buffer (1000 entries)
- HIPAA/GDPR/NDHM compliance scoring
- API: `GET /api/v1/compliance/dashboard`

### ✅ Existing v0.1 Features (Preserved)
- QR code scanner (getUserMedia)
- Offline-first IndexedDB via Dexie.js
- Auto-sync when online (queue drain)
- LDP-anonymized surveillance reports (ε = 0.75 randomized response)
- DBSCAN clustering via PostGIS ST_ClusterDBSCAN
- MVT tile endpoint for map rendering
- WebSocket real-time cluster updates
- AI chatbot (if CLAUDE_API_KEY set)
- Dark/light mode

---

## 🔸 Mocked / Simulated (Not Real Production Data)

| Feature | What's Mocked | Production Replacement |
|---------|---------------|------------------------|
| User database | In-memory Map | PostgreSQL `users` table |
| Refresh tokens | In-memory Map | PostgreSQL `refresh_tokens` table |
| FHIR resources | In-memory Map | PostgreSQL `fhir_resources` table |
| DICOM files | Metadata references only | PACS/OHIF integration |
| Federated learning | 3 simulated nodes | Real hospital API endpoints |
| MFA TOTP | Any 6-digit code accepted | Real TOTP: `speakeasy` library |
| Event persistence | Ring buffer | PostgreSQL `event_log` / Kafka |
| Population health data | Generated mock data | Real EMR/government health data |
| CDSS training | Hardcoded rule base | ML model (TensorFlow.js / Python) |
| Compliance checks | Rule-based scoring | Real HIPAA audit integration |
| Surveillance map | Placeholder (PostGIS needed) | Live PostGIS + MapLibre GL |
| ABHA ID validation | Field only, no API call | NHA sandbox API |

---

## ⚠️ Known Issues & Limitations

1. **Database required for full features**: DBSCAN clustering, surveillance tiles, and MVT map require a running PostgreSQL + PostGIS instance. Without DB, those endpoints will error.

2. **In-memory stores reset on restart**: Auth users, FHIR resources, and events are cleared when the backend restarts. Run the seed SQL to restore demo users.

3. **MFA is demo-only**: Any 6-digit code is accepted. Real production needs `speakeasy` or `otplib` with proper TOTP validation.

4. **FHIR IDs are random UUIDs**: Not connected to the `blind_records` encrypted patient store. Full integration requires a mapping layer.

5. **SSE wildcard subscription**: The `'*'` topic subscription in event bus is a hack — in production, implement proper topic routing.

6. **Federated learning is pure simulation**: Actual FL requires hospital nodes with local training infrastructure (Python/TensorFlow).

7. **DICOM is reference-only**: No actual DICOM file parsing. Integration with `dcmjs` or Cornerstone.js needed for full DICOM viewer.

8. **React Router**: The legacy `App.jsx` is accessible at `/app` — some features may overlap with new role dashboards.

9. **tailwind.config.js**: New dashboard pages use Tailwind, which requires the existing Tailwind setup. The `tailwind.config.js` content paths should include `./src/pages/**/*.tsx`.

---

## 🎯 Demo Flow (5-minute presentation)

1. **Open** http://localhost:5173 → lands on Login page
2. **Show** the beautiful split-panel login UI with role cards
3. **Click** "Demo Login as Doctor" → dashboard auto-populates
4. **Show** Doctor Dashboard → CDSS tab with AI recommendations
5. **Logout** → login as Authority
6. **Show** Authority Dashboard → SIR/SEIR model tab, adjust R₀ slider
7. **Show** Privacy budget meter (ε tracker)
8. **Open terminal**: `curl http://localhost:4000/health` → see all services "ok"
9. **Open terminal**: `curl -X POST http://localhost:4000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"doctor@omnishield.health","password":"Demo@1234"}'`
10. **Show** Swagger/API: `curl http://localhost:4000/api/v1/epidemic/simulate?model=seir`

---

## 🏆 Hackathon Scoring Points

| Category | Evidence |
|----------|---------|
| Innovation | Adaptive ε-budget + FL + SIR/SEIR in a unified platform |
| Technical Depth | PostGIS DBSCAN, Euler integration, FedAvg aggregation, NEWS2 scoring |
| Security | Zero-trust JWT + RBAC + AES-GCM-256 + double-fuzzed LDP |
| Scalability | Docker + K8s HPA manifests, stateless JWT |
| Standards | HL7 FHIR R4, ICD-10, ABHA ID, HIPAA/GDPR/NDHM |
| UX | Beautiful login, 6 role dashboards, dark/light mode, offline support |
| India-specific | ABHA ID, NDHM compliance, India district epidemic models |

---

*OmniShield v2.0 | Built in 24hrs | LOOP Hackathon*
