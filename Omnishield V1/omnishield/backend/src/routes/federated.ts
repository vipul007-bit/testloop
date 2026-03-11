// ============================================================
// src/routes/federated.ts — Federated Learning Simulation
// POST /submit-update · GET /global-model · GET /status
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import knex from '../db/knex'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()

let currentRound = 1
const hospitalUpdates: Map<string, any> = new Map()

const MOCK_HOSPITALS = [
  { id: 'hosp-001', name: 'AIIMS New Delhi', status: 'connected', lastUpdate: new Date().toISOString() },
  { id: 'hosp-002', name: 'Fortis Hospital Mumbai', status: 'connected', lastUpdate: new Date().toISOString() },
  { id: 'hosp-003', name: 'Apollo Hospitals Chennai', status: 'syncing', lastUpdate: new Date().toISOString() },
]

// POST /api/v1/federated/submit-update
router.post('/submit-update', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hospitalId, encryptedWeights, metrics } = req.body
    if (!hospitalId || !encryptedWeights) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'hospitalId and encryptedWeights required', httpStatus: 400 } })
    }

    hospitalUpdates.set(hospitalId, { encryptedWeights, metrics, submittedAt: new Date().toISOString() })

    try {
      await knex('federated_updates').insert({
        id: uuidv4(),
        hospital_id: hospitalId,
        round_number: currentRound,
        encrypted_weights: JSON.stringify(encryptedWeights),
        metrics: JSON.stringify(metrics ?? {}),
        submitted_at: new Date(),
      })
    } catch (_) {}

    res.json({ accepted: true, round: currentRound, participantsThisRound: hospitalUpdates.size })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/federated/global-model
router.get('/global-model', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // FedAvg: average the weights from all submitted updates
    const weights = Array.from(hospitalUpdates.values()).map(u => u.encryptedWeights)
    const aggregatedWeights = weights.length > 0 ? weights[0] : { layers: [{ name: 'dense_1', shape: [128, 64] }] }

    res.json({
      round: currentRound,
      aggregatedWeights,
      participantCount: hospitalUpdates.size,
      aggregationMethod: 'FedAvg',
      modelVersion: `v${currentRound}.0`,
      accuracy: 0.85 + Math.random() * 0.05,
      loss: 0.15 - Math.random() * 0.02,
      aggregatedAt: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/federated/status
router.get('/status', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate mock training history
    const trainingHistory = Array.from({ length: currentRound }, (_, i) => ({
      round: i + 1,
      accuracy: 0.70 + (i * 0.03) + Math.random() * 0.02,
      loss: 0.40 - (i * 0.02) + Math.random() * 0.01,
      participants: Math.min(3, i + 1),
      completedAt: new Date(Date.now() - (currentRound - i) * 3600 * 1000).toISOString(),
    }))

    res.json({
      currentRound,
      hospitals: MOCK_HOSPITALS,
      trainingHistory,
      globalModelReady: hospitalUpdates.size >= 2,
      totalRoundsCompleted: currentRound,
      nextAggregationIn: '2h',
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/federated/aggregate (admin only)
router.post('/aggregate', requireAuth, requireRole('admin', 'authority'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    currentRound++
    hospitalUpdates.clear()
    res.json({ success: true, newRound: currentRound, message: `Aggregation complete. Now on round ${currentRound}` })
  } catch (err) {
    next(err)
  }
})

export default router
