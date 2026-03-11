# 🛡️ OmniShield v2.0 — Smart Healthcare Surveillance & Decision Support Platform

> **Hackathon Project** — LOOP 24hr Hackathon | Built on OmniShield v0.1

OmniShield is a privacy-preserving, multi-role healthcare surveillance and clinical decision support platform for India's National Digital Health Mission (NDHM). It combines differential privacy, federated learning, FHIR interoperability, real-time event streaming, and epidemic spreading models.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        OmniShield v2.0                          │
├──────────────┬──────────────────────────────────────────────────┤
│  Frontend    │  React 18 + TypeScript + Tailwind + Vite PWA     │
│  (port 5173) │  Multi-role dashboards (6 roles), Login/MFA,     │
│              │  ABHA ID, Offline-first Dexie.js, React Router   │
├──────────────┼──────────────────────────────────────────────────┤
│  Backend     │  Node.js + Express + TypeScript (port 4000)       │
│              │  JWT+MFA auth, SIR/SEIR models, ε-accounting,    │
│              │  FHIR R4, Event Bus, FedAvg FL, CDSS, Analytics   │
├──────────────┼──────────────────────────────────────────────────┤
│  Database    │  PostgreSQL 15 + PostGIS (port 5432)             │
│              │  AES-GCM-256 encrypted records, DBSCAN clusters,  │
│              │  Privacy ledger, FHIR cache, Event log, FL rounds │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Docker Compose (Recommended)

```bash
cd "Omnishield V1/omnishield"
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Health check**: http://localhost:4000/health

### Manual Setup

```bash
# Backend
cd "Omnishield V1/omnishield/backend"
npm install && npm run dev

# Frontend (new terminal)
cd "Omnishield V1/omnishield/frontend"
npm install && npm run dev
```

### Environment Variables

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://omnishield:password@localhost:5432/omnishield_db
JWT_SECRET=your-32-char-minimum-secret-here
CORS_ORIGINS=http://localhost:5173
COORDINATE_FUZZ_DEGREES=0.001
```

---

## 🎭 Demo Login Credentials

Use the **"Demo Login"** buttons on the login page, or:

| Role | Email | Password |
|------|-------|----------|
| Doctor | doctor@omnishield.health | Demo@1234 |
| Nurse | nurse@omnishield.health | Demo@1234 |
| Lab Technician | lab@omnishield.health | Demo@1234 |
| Pharmacist | pharmacist@omnishield.health | Demo@1234 |
| Hospital Admin | admin@omnishield.health | Demo@1234 |
| Authority | authority@omnishield.health | Demo@1234 |

For MFA: any 6-digit code works in demo mode (e.g. `123456`).

---

## ✨ Features

| # | Feature | Status |
|---|---------|--------|
| 1 | Multi-role login with JWT + MFA (TOTP) + ABHA ID | ✅ Done |
| 2 | Role-specific dashboards (Doctor, Nurse, Lab, Pharmacy, Admin, Authority) | ✅ Done |
| 3 | SIR/SEIR epidemic spreading models with Euler integration | ✅ Done |
| 4 | Adaptive differential privacy budget (ε-accounting, sequential composition) | ✅ Done |
| 5 | HL7 FHIR R4 + DICOM interoperability APIs | ✅ Done |
| 6 | Real-time event streaming (SSE + EventEmitter/Kafka-compatible bus) | ✅ Done |
| 7 | Federated learning simulation (FedAvg, 3 hospital nodes) | ✅ Done |
| 8 | JWT RBAC + zero-trust auth + audit logging | ✅ Done |
| 9 | Clinical Decision Support (ICD-10, drug interactions, NEWS2) | ✅ Done |
| 10 | Population health analytics (trends, capacity, vaccination impact) | ✅ Done |
| 11 | Updated PostgreSQL schema with 8 new tables | ✅ Done |
| 12 | React Router v6 with protected RBAC routes | ✅ Done |
| 13 | Docker Compose + Dockerfiles + Kubernetes manifests | ✅ Done |
| 14 | Existing features preserved (QR scan, DBSCAN, LDP, offline sync) | ✅ Done |

---

## 📁 Project Structure

```
Omnishield V1/omnishield/
├── backend/
│   ├── src/
│   │   ├── app.ts                    # Express app + all routes
│   │   ├── routes/                   # auth, surveillance, epidemic,
│   │   │                             #   privacy, fhir, events,
│   │   │                             #   federated, cdss, analytics,
│   │   │                             #   compliance
│   │   ├── middleware/               # authMiddleware, auditLogger,
│   │   │                             #   errorHandler, rateLimiter
│   │   ├── services/                 # epidemicModel, privacyBudget,
│   │   │                             #   fhirService, dicomService,
│   │   │                             #   eventBus, federatedLearning,
│   │   │                             #   cdss, populationHealth,
│   │   │                             #   complianceService
│   │   └── db/                       # knex, pgListener
│   ├── schema.sql                    # Complete DB schema v2.0
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx                  # React entry + BrowserRouter
│   │   ├── router.tsx                # Protected routes
│   │   ├── App.jsx                   # Legacy app preserved
│   │   └── pages/                    # Login, DoctorDashboard,
│   │                                 #   NurseDashboard, LabTechDashboard,
│   │                                 #   PharmacistDashboard, AdminDashboard,
│   │                                 #   AuthorityDashboard
│   ├── nginx.conf                    # Production SPA config
│   └── Dockerfile
├── infra/k8s/omnishield.yaml         # K8s manifests
├── docker-compose.yml
├── README.md
└── DEMO.md
```

---

## 🌐 API Reference Summary

| Category | Base Path | Key Endpoints |
|----------|-----------|---------------|
| Auth | `/api/v1/auth` | register, login, mfa/setup, mfa/verify, refresh, logout |
| Surveillance | `/api/v1/surveillance` | report, tiles/:z/:x/:y.mvt, stats |
| Epidemic | `/api/v1/epidemic` | simulate, districts |
| Privacy | `/api/v1/privacy` | budget, allocate, report |
| FHIR | `/api/v1/fhir` | Patient, Observation, DiagnosticReport, MedicationRequest |
| Events | `/api/v1/events` | stream (SSE), history, publish |
| Federated | `/api/v1/federated` | train, status, metrics |
| CDSS | `/api/v1/cdss` | analyze, interactions, alerts/:patientId |
| Analytics | `/api/v1/analytics` | disease-trends, demographic-risk, seasonal-prediction, hospital-capacity, vaccination-impact |
| Compliance | `/api/v1/compliance` | dashboard, hipaa, gdpr, ndhm |
| Health | `/health` | Server health + service status |

---

## 🐳 Kubernetes

```bash
kubectl apply -f infra/k8s/omnishield.yaml
kubectl get pods -n omnishield
kubectl scale deployment omnishield-backend --replicas=5 -n omnishield
```

---

## 🔒 Security Architecture

- **Passwords**: scrypt (N=16384, r=8, p=1) — memory-hard
- **JWT**: HMAC-SHA256, 15-min access / 7-day refresh tokens
- **Patient coordinates**: Laplace noise fuzz (client + server = double-blind)
- **ICD codes**: Randomized Response LDP (ε ≈ 0.75)
- **Records**: AES-GCM-256 encrypted in browser IndexedDB + server-blind storage
- **Audit**: Ring-buffer + DB audit log on every API request

---

*MIT License — Hackathon demo. Not for clinical production without regulatory validation.*
