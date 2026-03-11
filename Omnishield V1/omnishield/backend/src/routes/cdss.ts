// ============================================================
// src/routes/cdss.ts — Clinical Decision Support Endpoints
// ============================================================

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { analyzePatient, checkDrugInteractions, getActiveAlerts, acknowledgeAlert, Vitals } from '../services/cdss'

const router = Router()

const VitalsSchema = z.object({
  systolicBP: z.number().optional(),
  diastolicBP: z.number().optional(),
  heartRate: z.number().optional(),
  respiratoryRate: z.number().optional(),
  temperature: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  consciousnessLevel: z.enum(['Alert', 'Voice', 'Pain', 'Unresponsive']).optional(),
}).optional()

const AnalyzeSchema = z.object({
  patientId: z.string().optional(),
  symptoms: z.array(z.string()).min(1),
  history: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  vitals: VitalsSchema,
})

const InteractionsSchema = z.object({
  medications: z.array(z.string()).min(2),
})

// POST /api/v1/cdss/analyze
router.post('/analyze', (req: Request, res: Response): void => {
  const result = AnalyzeSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.issues })
    return
  }

  const { patientId, symptoms, history, medications, vitals } = result.data
  const analysis = analyzePatient(symptoms, history, medications, (vitals ?? {}) as Vitals, patientId)
  res.json(analysis)
})

// GET /api/v1/cdss/interactions
router.get('/interactions', (req: Request, res: Response): void => {
  const medParam = req.query.medications as string | undefined
  if (!medParam) {
    res.status(400).json({ error: 'medications query param required (comma-separated)' })
    return
  }

  const medications = medParam.split(',').map(m => m.trim()).filter(Boolean)
  if (medications.length < 2) {
    res.status(400).json({ error: 'At least 2 medications required' })
    return
  }

  const alerts = checkDrugInteractions(medications)
  res.json({ medications, alerts, hasInteractions: alerts.length > 0 })
})

// POST /api/v1/cdss/interactions
router.post('/interactions', (req: Request, res: Response): void => {
  const result = InteractionsSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.issues })
    return
  }

  const alerts = checkDrugInteractions(result.data.medications)
  res.json({ medications: result.data.medications, alerts, hasInteractions: alerts.length > 0 })
})

// GET /api/v1/cdss/alerts/:patientId
router.get('/alerts/:patientId', (req: Request, res: Response): void => {
  const alerts = getActiveAlerts(req.params.patientId)
  res.json({ patientId: req.params.patientId, count: alerts.length, alerts })
})

// POST /api/v1/cdss/alerts/:patientId/:alertId/acknowledge
router.post('/alerts/:patientId/:alertId/acknowledge', (req: Request, res: Response): void => {
  const success = acknowledgeAlert(req.params.patientId, req.params.alertId)
  if (!success) {
    res.status(404).json({ error: 'Alert not found' })
    return
  }
  res.json({ acknowledged: true })
})

export default router
