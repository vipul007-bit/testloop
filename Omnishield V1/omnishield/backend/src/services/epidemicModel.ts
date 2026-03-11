// ============================================================
// src/services/epidemicModel.ts — SIR/SEIR Epidemic Simulator
// ============================================================

export interface SIRParams {
  S: number
  I: number
  R: number
  beta: number
  gamma: number
  days: number
}

export interface SEIRParams {
  S: number
  E: number
  I: number
  R: number
  beta: number
  sigma: number
  gamma: number
  days: number
}

export interface EpidemicResult {
  day: number
  S: number
  E?: number
  I: number
  R: number
}

export interface DistrictPrediction {
  district: string
  lat: number
  lon: number
  currentCases: number
  population: number
  peakDay: number
  peakInfected: number
  R0: number
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  forecast: EpidemicResult[]
}

// ── Euler integration for SIR ─────────────────────────────────
export function runSIR(params: SIRParams): EpidemicResult[] {
  const { beta, gamma, days } = params
  const N = params.S + params.I + params.R
  const dt = 1

  let S = params.S
  let I = params.I
  let R = params.R

  const results: EpidemicResult[] = [{ day: 0, S, I, R }]

  for (let day = 1; day <= days; day++) {
    const dS = -beta * S * I / N
    const dI = beta * S * I / N - gamma * I
    const dR = gamma * I

    S = Math.max(0, S + dS * dt)
    I = Math.max(0, I + dI * dt)
    R = Math.max(0, R + dR * dt)

    results.push({
      day,
      S: Math.round(S),
      I: Math.round(I),
      R: Math.round(R),
    })
  }

  return results
}

// ── Euler integration for SEIR ────────────────────────────────
export function runSEIR(params: SEIRParams): EpidemicResult[] {
  const { beta, sigma, gamma, days } = params
  const N = params.S + params.E + params.I + params.R
  const dt = 1

  let S = params.S
  let E = params.E
  let I = params.I
  let R = params.R

  const results: EpidemicResult[] = [{ day: 0, S, E, I, R }]

  for (let day = 1; day <= days; day++) {
    const dS = -beta * S * I / N
    const dE = beta * S * I / N - sigma * E
    const dI = sigma * E - gamma * I
    const dR = gamma * I

    S = Math.max(0, S + dS * dt)
    E = Math.max(0, E + dE * dt)
    I = Math.max(0, I + dI * dt)
    R = Math.max(0, R + dR * dt)

    results.push({
      day,
      S: Math.round(S),
      E: Math.round(E),
      I: Math.round(I),
      R: Math.round(R),
    })
  }

  return results
}

// ── Risk classification ────────────────────────────────────────
function classifyRisk(R0: number, incidenceRate: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (R0 > 3 || incidenceRate > 0.05) return 'Critical'
  if (R0 > 2 || incidenceRate > 0.02) return 'High'
  if (R0 > 1.2 || incidenceRate > 0.005) return 'Medium'
  return 'Low'
}

// ── District-level simulation ──────────────────────────────────
export function simulateDistricts(
  hotspots: Array<{ lat: number; lon: number; cases: number; population: number; district: string }>
): DistrictPrediction[] {
  return hotspots.map(h => {
    const gamma = 1 / 10  // recovery rate: 10 days
    const R0 = 1.5 + Math.random() * 1.5  // R0 between 1.5 and 3
    const beta = R0 * gamma

    const forecast = runSIR({
      S: h.population - h.cases,
      I: h.cases,
      R: 0,
      beta,
      gamma,
      days: 60,
    })

    const peakEntry = forecast.reduce((max, d) => (d.I > max.I ? d : max), forecast[0])
    const incidenceRate = h.cases / h.population

    return {
      district: h.district,
      lat: h.lat,
      lon: h.lon,
      currentCases: h.cases,
      population: h.population,
      peakDay: peakEntry.day,
      peakInfected: peakEntry.I,
      R0: Math.round(R0 * 100) / 100,
      riskLevel: classifyRisk(R0, incidenceRate),
      forecast,
    }
  })
}
