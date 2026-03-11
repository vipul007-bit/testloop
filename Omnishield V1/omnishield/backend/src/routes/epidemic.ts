// ============================================================
// src/routes/epidemic.ts — SIR/SEIR Epidemic Simulation
// POST /simulate · GET /hotspot-propagation
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'

const router = Router()

const SimulateSchema = z.object({
  model: z.enum(['SIR', 'SEIR']),
  population: z.number().min(1000).max(10_000_000),
  initialInfected: z.number().min(1).max(10000),
  r0: z.number().min(0.1).max(10),
  gamma: z.number().min(0.01).max(0.5), // recovery rate
  sigma: z.number().min(0.01).max(0.5).optional(), // incubation rate (SEIR only)
  days: z.number().min(1).max(365),
  district: z.string().optional(),
})

// SIR model: dS/dt = -β*S*I/N, dI/dt = β*S*I/N - γ*I, dR/dt = γ*I
function runSIR(N: number, I0: number, R0: number, gamma: number, days: number) {
  const beta = R0 * gamma
  const S: number[] = [N - I0]
  const I: number[] = [I0]
  const R: number[] = [0]

  const dt = 1
  for (let d = 1; d <= days; d++) {
    const s = S[d-1], i = I[d-1], r = R[d-1]
    const dS = -beta * s * i / N * dt
    const dI = (beta * s * i / N - gamma * i) * dt
    const dR = gamma * i * dt

    S.push(Math.max(0, s + dS))
    I.push(Math.max(0, i + dI))
    R.push(Math.max(0, r + dR))
  }
  return { S, I, R }
}

// SEIR model: dS/dt = -β*S*I/N, dE/dt = β*S*I/N - σ*E, dI/dt = σ*E - γ*I, dR/dt = γ*I
function runSEIR(N: number, I0: number, R0: number, gamma: number, sigma: number, days: number) {
  const beta = R0 * gamma
  const S: number[] = [N - I0]
  const E: number[] = [0]
  const I: number[] = [I0]
  const R: number[] = [0]

  const dt = 1
  for (let d = 1; d <= days; d++) {
    const s = S[d-1], e = E[d-1], i = I[d-1], r = R[d-1]
    const newExposed = beta * s * i / N * dt
    const dS = -newExposed
    const dE = newExposed - sigma * e * dt
    const dI = (sigma * e - gamma * i) * dt
    const dR = gamma * i * dt

    S.push(Math.max(0, s + dS))
    E.push(Math.max(0, e + dE))
    I.push(Math.max(0, i + dI))
    R.push(Math.max(0, r + dR))
  }
  return { S, E, I, R }
}

// POST /api/v1/epidemic/simulate
router.post('/simulate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = SimulateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } })
    }
    const { model, population: N, initialInfected: I0, r0: R0, gamma, sigma, days, district } = parsed.data

    let result: any
    const days_arr = Array.from({ length: days + 1 }, (_, i) => i)

    if (model === 'SIR') {
      const { S, I, R } = runSIR(N, I0, R0, gamma, days)
      const peakDay = I.indexOf(Math.max(...I))
      result = {
        model: 'SIR',
        district: district ?? 'Unknown',
        population: N,
        r0: R0,
        gamma,
        days,
        peakDay,
        peakInfected: Math.round(Math.max(...I)),
        series: days_arr.map(d => ({
          day: d,
          S: Math.round(S[d]),
          I: Math.round(I[d]),
          R: Math.round(R[d]),
        })),
      }
    } else {
      const sg = sigma ?? 0.2
      const { S, E, I, R } = runSEIR(N, I0, R0, gamma, sg, days)
      const peakDay = I.indexOf(Math.max(...I))
      result = {
        model: 'SEIR',
        district: district ?? 'Unknown',
        population: N,
        r0: R0,
        gamma,
        sigma: sg,
        days,
        peakDay,
        peakInfected: Math.round(Math.max(...I)),
        series: days_arr.map(d => ({
          day: d,
          S: Math.round(S[d]),
          E: Math.round(E[d]),
          I: Math.round(I[d]),
          R: Math.round(R[d]),
        })),
      }
    }
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/epidemic/hotspot-propagation
router.get('/hotspot-propagation', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock inter-district spread based on known DBSCAN clusters
    const districts = [
      { name: 'Delhi NCR', lat: 28.7041, lon: 77.1025, cases: 42, r0: 2.4, propagationRisk: 0.85 },
      { name: 'Mumbai Metro', lat: 19.0760, lon: 72.8777, cases: 38, r0: 2.1, propagationRisk: 0.78 },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639, cases: 28, r0: 1.9, propagationRisk: 0.65 },
      { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, cases: 17, r0: 1.6, propagationRisk: 0.52 },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, cases: 12, r0: 1.4, propagationRisk: 0.43 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707, cases: 8, r0: 1.3, propagationRisk: 0.38 },
    ]
    const edges = [
      { from: 'Delhi NCR', to: 'Kolkata', transmissionProb: 0.12 },
      { from: 'Delhi NCR', to: 'Mumbai Metro', transmissionProb: 0.10 },
      { from: 'Mumbai Metro', to: 'Bengaluru', transmissionProb: 0.08 },
      { from: 'Mumbai Metro', to: 'Hyderabad', transmissionProb: 0.07 },
      { from: 'Kolkata', to: 'Hyderabad', transmissionProb: 0.05 },
      { from: 'Bengaluru', to: 'Chennai', transmissionProb: 0.06 },
      { from: 'Hyderabad', to: 'Chennai', transmissionProb: 0.07 },
    ]
    res.json({ districts, transmissionEdges: edges, modeledAt: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
})

export default router
