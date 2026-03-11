// ============================================================
// src/routes/analytics.ts — Population Health Analytics Endpoints
// ============================================================

import { Router, Request, Response } from 'express'
import {
  getDiseaseTrends,
  getDemographicRiskScores,
  predictSeasonalOutbreaks,
  forecastHospitalCapacity,
  analyzeVaccinationImpact,
} from '../services/populationHealth'

const router = Router()

// GET /api/v1/analytics/disease-trends
router.get('/disease-trends', (req: Request, res: Response): void => {
  const icdCode = (req.query.icdCode as string | undefined) ?? 'J18.9'
  const days = Math.min(parseInt(req.query.days as string ?? '30', 10), 365)
  const trends = getDiseaseTrends(icdCode, days)
  res.json({ icdCode, days, data: trends })
})

// GET /api/v1/analytics/demographic-risk
router.get('/demographic-risk', (_req: Request, res: Response): void => {
  const data = getDemographicRiskScores()
  res.json({ generatedAt: new Date().toISOString(), count: data.length, data })
})

// GET /api/v1/analytics/seasonal-prediction
router.get('/seasonal-prediction', (_req: Request, res: Response): void => {
  const predictions = predictSeasonalOutbreaks()
  res.json({ generatedAt: new Date().toISOString(), predictions })
})

// GET /api/v1/analytics/hospital-capacity
router.get('/hospital-capacity', (req: Request, res: Response): void => {
  const hospitalId = (req.query.hospitalId as string | undefined) ?? 'MUM-001'
  const forecast = forecastHospitalCapacity(hospitalId)
  res.json({ hospitalId, forecast })
})

// GET /api/v1/analytics/vaccination-impact
router.get('/vaccination-impact', (req: Request, res: Response): void => {
  const vaccineId = (req.query.vaccineId as string | undefined) ?? 'COVID19-mRNA'
  const coveragePercent = parseFloat(req.query.coverage as string ?? '70')

  if (isNaN(coveragePercent) || coveragePercent < 0 || coveragePercent > 100) {
    res.status(400).json({ error: 'coverage must be a number between 0 and 100' })
    return
  }

  const impact = analyzeVaccinationImpact(vaccineId, coveragePercent)
  res.json(impact)
})

export default router
