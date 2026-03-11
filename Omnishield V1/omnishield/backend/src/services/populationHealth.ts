// ============================================================
// src/services/populationHealth.ts — Population Health Analytics
// ============================================================

export interface TimeSeriesPoint {
  date: string
  cases: number
  movingAverage: number
  expSmoothed: number
}

export interface DemographicRisk {
  ageGroup: string
  gender: 'Male' | 'Female' | 'All'
  region: string
  riskScore: number
  conditions: string[]
  prevalence: number
}

export interface SeasonalPrediction {
  disease: string
  icd10Code: string
  month: string
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  predictedCases: number
  confidence: number
  peakMonths: string[]
}

export interface CapacityForecast {
  hospitalId: string
  date: string
  predictedOccupancy: number
  availableBeds: number
  totalBeds: number
  icuOccupancy: number
  icuCapacity: number
  alert: boolean
}

export interface VaccinationImpact {
  vaccineId: string
  diseaseName: string
  baselineR0: number
  effectiveR0: number
  coveragePercent: number
  herdImmunityThreshold: number
  herdImmunityAchieved: boolean
  casesAverted: number
  mortalityReduction: number
}

// ── Helpers ────────────────────────────────────────────────────

// Generate pseudo-random deterministic values (seed-based)
function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function movingAverage(data: number[], window: number): number[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1)
    const slice = data.slice(start, i + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

function exponentialSmoothing(data: number[], alpha = 0.3): number[] {
  const result: number[] = [data[0]]
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1])
  }
  return result
}

// ── Disease trends ─────────────────────────────────────────────
export function getDiseaseTrends(icdCode: string, days = 30): TimeSeriesPoint[] {
  const seed = icdCode.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const baseCount = 50 + seed % 200
  const raw: number[] = []

  for (let i = 0; i < days; i++) {
    const trend = Math.sin((i / days) * Math.PI * 2) * 20
    const noise = seededRand(seed + i) * 40
    raw.push(Math.max(0, Math.round(baseCount + trend + noise)))
  }

  const ma = movingAverage(raw, 7)
  const es = exponentialSmoothing(raw)

  const today = new Date()
  return raw.map((cases, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - days + i)
    return {
      date: date.toISOString().slice(0, 10),
      cases,
      movingAverage: Math.round(ma[i] * 10) / 10,
      expSmoothed: Math.round(es[i] * 10) / 10,
    }
  })
}

// ── Demographic risk scores ────────────────────────────────────
export function getDemographicRiskScores(): DemographicRisk[] {
  const ageGroups = ['0-14', '15-29', '30-44', '45-59', '60-74', '75+']
  const regions = ['North India', 'South India', 'East India', 'West India', 'Central India']
  const results: DemographicRisk[] = []

  ageGroups.forEach((ag, ai) => {
    (['Male', 'Female'] as const).forEach((gender, gi) => {
      const region = regions[Math.floor((ai * 2 + gi) % regions.length)]
      const ageRisk = ai < 2 ? 0.3 : ai < 4 ? 0.5 : 0.8
      const genderAdj = gender === 'Male' ? 0.05 : 0
      const riskScore = Math.min(1, ageRisk + genderAdj + seededRand(ai * 10 + gi) * 0.2)

      const conditionPool = ['Diabetes', 'Hypertension', 'CVD', 'COPD', 'Asthma', 'Malnutrition', 'Anemia', 'TB']
      const conditions = conditionPool.filter((_, ci) => seededRand(ai * ci + gi) > 0.6)

      results.push({
        ageGroup: ag,
        gender,
        region,
        riskScore: Math.round(riskScore * 100) / 100,
        conditions,
        prevalence: Math.round((0.05 + seededRand(ai + gi) * 0.3) * 1000) / 1000,
      })
    })
  })

  return results
}

// ── Seasonal outbreak prediction ───────────────────────────────
export function predictSeasonalOutbreaks(): SeasonalPrediction[] {
  const diseases = [
    { disease: 'Dengue Fever', icd10Code: 'A90', peakMonths: ['August', 'September', 'October'], baseRate: 800 },
    { disease: 'Malaria', icd10Code: 'B50', peakMonths: ['July', 'August', 'September'], baseRate: 600 },
    { disease: 'Cholera', icd10Code: 'A00', peakMonths: ['June', 'July', 'August'], baseRate: 200 },
    { disease: 'Japanese Encephalitis', icd10Code: 'A83.0', peakMonths: ['July', 'August'], baseRate: 100 },
    { disease: 'Typhoid', icd10Code: 'A01.0', peakMonths: ['May', 'June', 'July'], baseRate: 400 },
    { disease: 'Influenza', icd10Code: 'J11.1', peakMonths: ['December', 'January', 'February'], baseRate: 1200 },
  ]

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  const nextMonthIdx = (new Date().getMonth() + 1) % 12
  const predictions: SeasonalPrediction[] = []

  for (const d of diseases) {
    // Predict next 3 months
    for (let m = 0; m < 3; m++) {
      const month = months[(new Date().getMonth() + m) % 12]
      const isPeak = d.peakMonths.includes(month)
      const isNearPeak = d.peakMonths.includes(months[nextMonthIdx])
      const multiplier = isPeak ? 3 : isNearPeak ? 2 : 0.5
      const predictedCases = Math.round(d.baseRate * multiplier * (0.8 + seededRand(d.icd10Code.length + m) * 0.4))

      let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
      if (predictedCases > d.baseRate * 2.5) riskLevel = 'Critical'
      else if (predictedCases > d.baseRate * 1.5) riskLevel = 'High'
      else if (predictedCases > d.baseRate * 0.8) riskLevel = 'Medium'
      else riskLevel = 'Low'

      predictions.push({
        disease: d.disease,
        icd10Code: d.icd10Code,
        month,
        riskLevel,
        predictedCases,
        confidence: Math.round((0.6 + seededRand(d.baseRate + m) * 0.3) * 100) / 100,
        peakMonths: d.peakMonths,
      })
    }
  }

  return predictions.sort((a, b) => b.predictedCases - a.predictedCases)
}

// ── Hospital capacity forecast ─────────────────────────────────
const HOSPITAL_CAPACITY: Record<string, { totalBeds: number; icuCapacity: number }> = {
  'MUM-001': { totalBeds: 800, icuCapacity: 80 },
  'DEL-001': { totalBeds: 1200, icuCapacity: 120 },
  'BLR-001': { totalBeds: 600, icuCapacity: 60 },
  'CHE-001': { totalBeds: 700, icuCapacity: 70 },
  'KOL-001': { totalBeds: 500, icuCapacity: 50 },
}

export function forecastHospitalCapacity(hospitalId: string): CapacityForecast[] {
  const config = HOSPITAL_CAPACITY[hospitalId] ?? { totalBeds: 500, icuCapacity: 50 }
  const forecasts: CapacityForecast[] = []
  const today = new Date()
  const seed = hospitalId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  for (let day = 0; day < 14; day++) {
    const date = new Date(today)
    date.setDate(date.getDate() + day)
    const dayOfWeek = date.getDay()
    const weekendAdj = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.0
    const trend = 1 + day * 0.01  // slight upward trend
    const noise = 0.9 + seededRand(seed + day) * 0.2

    const occupancyRate = Math.min(0.98, 0.65 * weekendAdj * trend * noise)
    const icuRate = Math.min(0.98, 0.6 * weekendAdj * trend * noise)
    const availableBeds = Math.max(0, Math.round(config.totalBeds * (1 - occupancyRate)))

    forecasts.push({
      hospitalId,
      date: date.toISOString().slice(0, 10),
      predictedOccupancy: Math.round(occupancyRate * 100) / 100,
      availableBeds,
      totalBeds: config.totalBeds,
      icuOccupancy: Math.round(icuRate * 100) / 100,
      icuCapacity: config.icuCapacity,
      alert: occupancyRate > 0.9 || icuRate > 0.85,
    })
  }

  return forecasts
}

// ── Vaccination impact analysis ────────────────────────────────
const VACCINE_DB: Record<string, { disease: string; R0: number; efficacy: number }> = {
  'COVID19-mRNA': { disease: 'COVID-19', R0: 5.7, efficacy: 0.94 },
  'MMR': { disease: 'Measles/Mumps/Rubella', R0: 15, efficacy: 0.97 },
  'OPV': { disease: 'Poliomyelitis', R0: 6, efficacy: 0.95 },
  'DTP': { disease: 'Diphtheria/Tetanus/Pertussis', R0: 12, efficacy: 0.85 },
  'HepB': { disease: 'Hepatitis B', R0: 4, efficacy: 0.90 },
  'ROTAVIRUS': { disease: 'Rotavirus gastroenteritis', R0: 3.5, efficacy: 0.74 },
}

export function analyzeVaccinationImpact(vaccineId: string, coveragePercent = 70): VaccinationImpact {
  const vax = VACCINE_DB[vaccineId] ?? { disease: 'Unknown', R0: 2.5, efficacy: 0.80 }
  const effectiveR0 = vax.R0 * (1 - (coveragePercent / 100) * vax.efficacy)
  const herdImmunityThreshold = Math.round((1 - 1 / vax.R0) * 100)
  const casesAverted = Math.round(100000 * (vax.R0 - effectiveR0) / vax.R0)

  return {
    vaccineId,
    diseaseName: vax.disease,
    baselineR0: vax.R0,
    effectiveR0: Math.round(effectiveR0 * 100) / 100,
    coveragePercent,
    herdImmunityThreshold,
    herdImmunityAchieved: coveragePercent * vax.efficacy >= herdImmunityThreshold,
    casesAverted,
    mortalityReduction: Math.round(vax.efficacy * coveragePercent * 0.8) / 100,
  }
}
