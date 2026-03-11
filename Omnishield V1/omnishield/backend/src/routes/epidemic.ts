// ============================================================
// src/routes/epidemic.ts — Epidemic Simulation Endpoints
// ============================================================

import { Router, Request, Response } from 'express'
import { runSIR, runSEIR, simulateDistricts } from '../services/epidemicModel'

const router = Router()

// Mock India district hotspots
const INDIA_DISTRICTS = [
  { district: 'Mumbai', lat: 19.076, lon: 72.877, cases: 1200, population: 12478447 },
  { district: 'Delhi', lat: 28.613, lon: 77.209, cases: 950, population: 11034555 },
  { district: 'Bengaluru Urban', lat: 12.971, lon: 77.594, cases: 780, population: 8443675 },
  { district: 'Chennai', lat: 13.082, lon: 80.270, cases: 620, population: 7088000 },
  { district: 'Kolkata', lat: 22.572, lon: 88.363, cases: 540, population: 4496694 },
  { district: 'Pune', lat: 18.520, lon: 73.856, cases: 430, population: 3124458 },
]

// GET /api/v1/epidemic/simulate
router.get('/simulate', (req: Request, res: Response): void => {
  const model = (req.query.model as string | undefined) ?? 'sir'
  const population = parseInt(req.query.population as string ?? '100000', 10)
  const infected = parseInt(req.query.infected as string ?? '100', 10)
  const exposed = parseInt(req.query.exposed as string ?? '200', 10)
  const beta = parseFloat(req.query.beta as string ?? '0.3')
  const gamma = parseFloat(req.query.gamma as string ?? '0.1')
  const sigma = parseFloat(req.query.sigma as string ?? '0.2')
  const days = Math.min(parseInt(req.query.days as string ?? '90', 10), 365)

  if (isNaN(population) || isNaN(infected) || isNaN(beta) || isNaN(gamma)) {
    res.status(400).json({ error: 'Invalid numeric parameters' })
    return
  }

  if (model === 'seir') {
    const result = runSEIR({
      S: population - exposed - infected,
      E: exposed,
      I: infected,
      R: 0,
      beta,
      sigma,
      gamma,
      days,
    })
    res.json({ model: 'SEIR', params: { population, infected, exposed, beta, sigma, gamma, days }, results: result })
  } else {
    const result = runSIR({
      S: population - infected,
      I: infected,
      R: 0,
      beta,
      gamma,
      days,
    })
    res.json({ model: 'SIR', params: { population, infected, beta, gamma, days }, results: result })
  }
})

// GET /api/v1/epidemic/districts
router.get('/districts', (_req: Request, res: Response): void => {
  const predictions = simulateDistricts(INDIA_DISTRICTS)
  res.json({
    generatedAt: new Date().toISOString(),
    totalDistricts: predictions.length,
    predictions: predictions.map(p => ({
      district: p.district,
      lat: p.lat,
      lon: p.lon,
      currentCases: p.currentCases,
      population: p.population,
      peakDay: p.peakDay,
      peakInfected: p.peakInfected,
      R0: p.R0,
      riskLevel: p.riskLevel,
      // Return abbreviated forecast (every 5 days to reduce payload)
      forecast: p.forecast.filter(d => d.day % 5 === 0),
    })),
  })
})

export default router
