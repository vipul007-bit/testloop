// ============================================================
// src/services/privacyBudget.ts — Adaptive Differential Privacy Budget
// ============================================================

export interface BudgetStatus {
  userId: string
  sessionId: string
  used: number
  remaining: number
  limit: number
  allocations: BudgetAllocation[]
}

export interface BudgetAllocation {
  timestamp: string
  requestedEpsilon: number
  approvedEpsilon: number
  operation: string
}

export interface ComplianceReport {
  userId: string
  totalSessions: number
  totalEpsilonUsed: number
  averageEpsilonPerSession: number
  sessions: SessionSummary[]
  generatedAt: string
}

export interface SessionSummary {
  sessionId: string
  used: number
  remaining: number
  limit: number
  allocationCount: number
}

// ── In-memory store ───────────────────────────────────────────
const DEFAULT_BUDGET = 5.0
const budgetStore = new Map<string, BudgetStatus>()

function getKey(userId: string, sessionId: string): string {
  return `${userId}::${sessionId}`
}

function ensureBudget(userId: string, sessionId: string): BudgetStatus {
  const key = getKey(userId, sessionId)
  if (!budgetStore.has(key)) {
    budgetStore.set(key, {
      userId,
      sessionId,
      used: 0,
      remaining: DEFAULT_BUDGET,
      limit: DEFAULT_BUDGET,
      allocations: [],
    })
  }
  return budgetStore.get(key)!
}

// ── Budget allocation ─────────────────────────────────────────
export function allocateBudget(
  userId: string,
  sessionId: string,
  requestedEpsilon: number,
  operation = 'query'
): number {
  const status = ensureBudget(userId, sessionId)

  if (requestedEpsilon <= 0) {
    throw new Error('requestedEpsilon must be positive')
  }

  if (status.remaining <= 0) {
    throw new Error(`Privacy budget exhausted for session ${sessionId}. Used: ${status.used}/${status.limit}`)
  }

  const approved = Math.min(requestedEpsilon, status.remaining)
  status.used += approved
  status.remaining = Math.max(0, status.limit - status.used)

  status.allocations.push({
    timestamp: new Date().toISOString(),
    requestedEpsilon,
    approvedEpsilon: approved,
    operation,
  })

  return approved
}

// ── Budget status ─────────────────────────────────────────────
export function getBudgetStatus(userId: string, sessionId: string): BudgetStatus {
  return ensureBudget(userId, sessionId)
}

// ── Reset budget (for new sessions) ──────────────────────────
export function resetBudget(userId: string, sessionId: string): void {
  const key = getKey(userId, sessionId)
  budgetStore.delete(key)
}

// ── Compliance report ─────────────────────────────────────────
export function generateComplianceReport(userId: string): ComplianceReport {
  const sessions: SessionSummary[] = []
  let totalEpsilonUsed = 0

  for (const [key, status] of budgetStore.entries()) {
    if (key.startsWith(`${userId}::`)) {
      sessions.push({
        sessionId: status.sessionId,
        used: status.used,
        remaining: status.remaining,
        limit: status.limit,
        allocationCount: status.allocations.length,
      })
      totalEpsilonUsed += status.used
    }
  }

  return {
    userId,
    totalSessions: sessions.length,
    totalEpsilonUsed: Math.round(totalEpsilonUsed * 1000) / 1000,
    averageEpsilonPerSession: sessions.length > 0
      ? Math.round((totalEpsilonUsed / sessions.length) * 1000) / 1000
      : 0,
    sessions,
    generatedAt: new Date().toISOString(),
  }
}
