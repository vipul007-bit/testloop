// ============================================================
// src/services/federatedLearning.ts — Simulated FL Coordinator
// ============================================================

export interface ModelWeights {
  layer1: number[]
  layer2: number[]
  bias: number[]
}

export interface HospitalUpdate {
  hospitalId: string
  weights: ModelWeights
  sampleSize: number
  localLoss: number
  localAccuracy: number
}

export interface TrainingRound {
  round: number
  modelType: string
  startedAt: string
  completedAt: string
  participatingHospitals: string[]
  globalLoss: number
  globalAccuracy: number
  aggregatedWeights: ModelWeights
}

export interface ModelStatus {
  currentRound: number
  modelType: string
  globalWeights: ModelWeights
  lastUpdated: string
  participatingHospitals: string[]
  isTraining: boolean
}

// ── Simulated hospital nodes ──────────────────────────────────
const HOSPITALS = [
  { id: 'MumbaiGeneral', sampleSize: 3200, noiseFactor: 0.05 },
  { id: 'DelhiAIIMS', sampleSize: 5000, noiseFactor: 0.03 },
  { id: 'BangaloreVictoria', sampleSize: 2800, noiseFactor: 0.06 },
]

// ── Weights initialisation ────────────────────────────────────
function initWeights(): ModelWeights {
  return {
    layer1: Array.from({ length: 8 }, () => Math.random() * 0.2 - 0.1),
    layer2: Array.from({ length: 4 }, () => Math.random() * 0.2 - 0.1),
    bias: Array.from({ length: 4 }, () => Math.random() * 0.1),
  }
}

function addNoise(weights: ModelWeights, factor: number): ModelWeights {
  const applyNoise = (arr: number[]) => arr.map(w => w + (Math.random() - 0.5) * factor)
  return { layer1: applyNoise(weights.layer1), layer2: applyNoise(weights.layer2), bias: applyNoise(weights.bias) }
}

// ── FedAvg aggregation ────────────────────────────────────────
export function aggregateFedAvg(updates: HospitalUpdate[]): ModelWeights {
  const totalSamples = updates.reduce((s, u) => s + u.sampleSize, 0)

  const avg = (key: keyof ModelWeights) => {
    const length = updates[0].weights[key].length
    return Array.from({ length }, (_, i) =>
      updates.reduce((sum, u) => sum + u.weights[key][i] * (u.sampleSize / totalSamples), 0)
    )
  }

  return { layer1: avg('layer1'), layer2: avg('layer2'), bias: avg('bias') }
}

// ── FL Coordinator ────────────────────────────────────────────
class FederatedLearningService {
  private currentRound = 0
  private modelType = 'disease-classifier-v1'
  private globalWeights: ModelWeights = initWeights()
  private isTraining = false
  private trainingHistory: TrainingRound[] = []
  private lastUpdated = new Date().toISOString()

  async startTrainingRound(modelType?: string): Promise<TrainingRound> {
    if (this.isTraining) {
      throw new Error('Training round already in progress')
    }

    this.isTraining = true
    this.modelType = modelType ?? this.modelType
    this.currentRound++
    const roundNum = this.currentRound
    const startedAt = new Date().toISOString()

    // Simulate local training at each hospital
    const updates: HospitalUpdate[] = HOSPITALS.map(h => {
      const localWeights = addNoise(this.globalWeights, h.noiseFactor)

      // Converging metrics: loss decreases, accuracy increases per round
      const roundFactor = Math.min(roundNum * 0.08, 0.85)
      const localLoss = Math.max(0.05, 0.9 - roundFactor + (Math.random() - 0.5) * 0.05)
      const localAccuracy = Math.min(0.98, 0.55 + roundFactor + (Math.random() - 0.5) * 0.03)

      return {
        hospitalId: h.id,
        weights: localWeights,
        sampleSize: h.sampleSize,
        localLoss: Math.round(localLoss * 10000) / 10000,
        localAccuracy: Math.round(localAccuracy * 10000) / 10000,
      }
    })

    // FedAvg aggregation
    this.globalWeights = aggregateFedAvg(updates)
    this.lastUpdated = new Date().toISOString()
    this.isTraining = false

    const totalSamples = HOSPITALS.reduce((s, h) => s + h.sampleSize, 0)
    const globalLoss = updates.reduce((s, u) => s + u.localLoss * (u.sampleSize / totalSamples), 0)
    const globalAccuracy = updates.reduce((s, u) => s + u.localAccuracy * (u.sampleSize / totalSamples), 0)

    const round: TrainingRound = {
      round: roundNum,
      modelType: this.modelType,
      startedAt,
      completedAt: new Date().toISOString(),
      participatingHospitals: HOSPITALS.map(h => h.id),
      globalLoss: Math.round(globalLoss * 10000) / 10000,
      globalAccuracy: Math.round(globalAccuracy * 10000) / 10000,
      aggregatedWeights: this.globalWeights,
    }

    this.trainingHistory.push(round)
    return round
  }

  getModelStatus(): ModelStatus {
    return {
      currentRound: this.currentRound,
      modelType: this.modelType,
      globalWeights: this.globalWeights,
      lastUpdated: this.lastUpdated,
      participatingHospitals: HOSPITALS.map(h => h.id),
      isTraining: this.isTraining,
    }
  }

  getTrainingMetrics(): { rounds: TrainingRound[]; summary: { totalRounds: number; bestAccuracy: number; latestLoss: number } } {
    const best = this.trainingHistory.reduce(
      (b, r) => (r.globalAccuracy > b ? r.globalAccuracy : b), 0
    )
    const latest = this.trainingHistory[this.trainingHistory.length - 1]

    return {
      rounds: this.trainingHistory,
      summary: {
        totalRounds: this.currentRound,
        bestAccuracy: best,
        latestLoss: latest?.globalLoss ?? 0,
      },
    }
  }
}

export const federatedLearningService = new FederatedLearningService()
