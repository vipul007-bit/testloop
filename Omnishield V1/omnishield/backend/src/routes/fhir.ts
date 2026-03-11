// ============================================================
// src/routes/fhir.ts — RESTful FHIR R4 Endpoints
// ============================================================

import { Router, Request, Response } from 'express'
import {
  createPatientResource,
  createObservationResource,
  createDiagnosticReportResource,
  createMedicationRequestResource,
  createBundle,
  convertFromFHIR,
  FHIRPatient,
  FHIRObservation,
  FHIRDiagnosticReport,
  FHIRMedicationRequest,
  PatientInput,
  ObservationInput,
  DiagnosticReportInput,
  MedicationRequestInput,
} from '../services/fhirService'

const router = Router()

// ── In-memory stores ──────────────────────────────────────────
const patientStore = new Map<string, FHIRPatient>()
const observationStore = new Map<string, FHIRObservation[]>()  // patientId → observations
const diagnosticReportStore = new Map<string, FHIRDiagnosticReport[]>()
const medicationRequestStore = new Map<string, FHIRMedicationRequest[]>()

// ── Patient ───────────────────────────────────────────────────
router.get('/Patient/:id', (req: Request, res: Response): void => {
  const patient = patientStore.get(req.params.id)
  if (!patient) {
    res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: `Patient/${req.params.id} not found` }] })
    return
  }
  res.json(patient)
})

router.post('/Patient', (req: Request, res: Response): void => {
  const input = req.body as PatientInput
  if (!input.name) {
    res.status(400).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'required', diagnostics: 'Patient name is required' }] })
    return
  }

  const patient = createPatientResource(input)
  patientStore.set(patient.id, patient)
  res.status(201).location(`/api/v1/fhir/Patient/${patient.id}`).json(patient)
})

// ── Observation ───────────────────────────────────────────────
router.get('/Observation/:patientId', (req: Request, res: Response): void => {
  const observations = observationStore.get(req.params.patientId) ?? []
  const bundle = createBundle(observations, 'searchset')
  res.json(bundle)
})

router.post('/Observation', (req: Request, res: Response): void => {
  const input = req.body as ObservationInput
  if (!input.patientId || !input.loincCode || !input.display) {
    res.status(400).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'required', diagnostics: 'patientId, loincCode, and display are required' }] })
    return
  }

  const observation = createObservationResource(input)
  const existing = observationStore.get(input.patientId) ?? []
  existing.push(observation)
  observationStore.set(input.patientId, existing)
  res.status(201).json(observation)
})

// ── DiagnosticReport ──────────────────────────────────────────
router.get('/DiagnosticReport/:patientId', (req: Request, res: Response): void => {
  const reports = diagnosticReportStore.get(req.params.patientId) ?? []
  const bundle = createBundle(reports, 'searchset')
  res.json(bundle)
})

router.post('/DiagnosticReport', (req: Request, res: Response): void => {
  const input = req.body as DiagnosticReportInput
  if (!input.patientId || !input.code || !input.display) {
    res.status(400).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'required', diagnostics: 'patientId, code, and display are required' }] })
    return
  }

  const report = createDiagnosticReportResource(input)
  const existing = diagnosticReportStore.get(input.patientId) ?? []
  existing.push(report)
  diagnosticReportStore.set(input.patientId, existing)
  res.status(201).json(report)
})

// ── MedicationRequest ─────────────────────────────────────────
router.get('/MedicationRequest/:patientId', (req: Request, res: Response): void => {
  const meds = medicationRequestStore.get(req.params.patientId) ?? []
  const bundle = createBundle(meds, 'searchset')
  res.json(bundle)
})

router.post('/MedicationRequest', (req: Request, res: Response): void => {
  const input = req.body as MedicationRequestInput
  if (!input.patientId || !input.rxnormCode || !input.medicationName) {
    res.status(400).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'required', diagnostics: 'patientId, rxnormCode, and medicationName are required' }] })
    return
  }

  const med = createMedicationRequestResource(input)
  const existing = medicationRequestStore.get(input.patientId) ?? []
  existing.push(med)
  medicationRequestStore.set(input.patientId, existing)
  res.status(201).json(med)
})

// ── Utility: convert FHIR to internal ────────────────────────
router.post('/convert', (req: Request, res: Response): void => {
  const resource = req.body as FHIRPatient | FHIRObservation | FHIRDiagnosticReport | FHIRMedicationRequest
  if (!resource.resourceType) {
    res.status(400).json({ error: 'resourceType is required' })
    return
  }
  res.json(convertFromFHIR(resource))
})

export default router
