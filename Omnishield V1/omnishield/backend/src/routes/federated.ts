// ============================================================
// src/routes/federated.ts — Federated Learning Endpoints
// ============================================================

import { Router, Request, Response } from 'express'
import { federatedLearningService } from '../services/federatedLearning'

const router = Router()

// POST /api/v1/federated/train — Start training round
router.post('/train', async (req: Request, res: Response): Promise<void> => {
  const modelType = (req.body as { modelType?: string }).modelType

  try {
    const round = await federatedLearningService.startTrainingRound(modelType)
    res.json({
      message: 'Training round completed',
      round: round.round,
      modelType: round.modelType,
      globalLoss: round.globalLoss,
      globalAccuracy: round.globalAccuracy,
      participatingHospitals: round.participatingHospitals,
      startedAt: round.startedAt,
      completedAt: round.completedAt,
    })
  } catch (err) {
    res.status(409).json({ error: (err as Error).message })
  }
})

// GET /api/v1/federated/status — Current model status
router.get('/status', (_req: Request, res: Response): void => {
  const status = federatedLearningService.getModelStatus()
  res.json({
    currentRound: status.currentRound,
    modelType: status.modelType,
    lastUpdated: status.lastUpdated,
    participatingHospitals: status.participatingHospitals,
    isTraining: status.isTraining,
    // Omit weights from status for brevity; use /metrics for full weights
    weightsShape: {
      layer1: status.globalWeights.layer1.length,
      layer2: status.globalWeights.layer2.length,
      bias: status.globalWeights.bias.length,
    },
  })
})

// GET /api/v1/federated/metrics — Training metrics history
router.get('/metrics', (_req: Request, res: Response): void => {
  const { rounds, summary } = federatedLearningService.getTrainingMetrics()
  res.json({
    summary,
    rounds: rounds.map(r => ({
      round: r.round,
      modelType: r.modelType,
      globalLoss: r.globalLoss,
      globalAccuracy: r.globalAccuracy,
      participatingHospitals: r.participatingHospitals,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
    })),
  })
})

export default router
