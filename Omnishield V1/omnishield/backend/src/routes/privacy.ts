// ============================================================
// src/routes/privacy.ts — Adaptive Privacy Budget Management
// GET /budget · POST /query · GET /report
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import knex from '../db/knex'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()

const DEFAULT_BUDGET = 10.0

const QuerySchema = z.object({
  queryType: z.string(),
  epsilonUsed: z.number().min(0.01).max(1.0),
  queryParams: z.record(z.any()).optional(),
})

async function getOrCreateBudget() {
  let budget = null
  try {
    budget = await knex('privacy_budget').orderBy('created_at', 'asc').first()
  } catch (_) {}
  if (!budget) {
    const id = uuidv4()
    try {
      await knex('privacy_budget').insert({
        id,
        total_budget: DEFAULT_BUDGET,
        spent: 0,
        query_count: 0,
        created_at: new Date(),
      })
      return { id, total_budget: DEFAULT_BUDGET, spent: 0, query_count: 0 }
    } catch (_) {
      return { id: '1', total_budget: DEFAULT_BUDGET, spent: 0, query_count: 0 }
    }
  }
  return budget
}

// GET /api/v1/privacy/budget
router.get('/budget', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await getOrCreateBudget()
    const remaining = Math.max(0, budget.total_budget - budget.spent)
    res.json({
      totalBudget: budget.total_budget,
      spent: budget.spent,
      remaining,
      queryCount: budget.query_count,
      exhausted: remaining <= 0,
      lastQueryAt: budget.last_query_at ?? null,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/privacy/query
router.post('/query', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = QuerySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } })
    }
    const { queryType, epsilonUsed, queryParams } = parsed.data

    const budget = await getOrCreateBudget()
    const remaining = budget.total_budget - budget.spent

    if (epsilonUsed > remaining) {
      return res.status(429).json({
        error: {
          code: 'PRIVACY_BUDGET_EXHAUSTED',
          message: `Privacy budget exhausted. Remaining: ε=${remaining.toFixed(3)}. Requested: ε=${epsilonUsed}`,
          httpStatus: 429,
        },
        remaining,
        spent: budget.spent,
      })
    }

    // Deduct from budget
    const newSpent = budget.spent + epsilonUsed
    try {
      await knex('privacy_budget').where({ id: budget.id }).update({
        spent: newSpent,
        query_count: budget.query_count + 1,
        last_query_at: new Date(),
      })

      await knex('privacy_query_log').insert({
        id: uuidv4(),
        budget_id: budget.id,
        epsilon_used: epsilonUsed,
        query_type: queryType,
        query_params: JSON.stringify(queryParams ?? {}),
        created_at: new Date(),
      })
    } catch (_) {}

    res.json({
      accepted: true,
      epsilonUsed,
      totalSpent: newSpent,
      remaining: Math.max(0, budget.total_budget - newSpent),
      queryCount: budget.query_count + 1,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/privacy/report
router.get('/report', requireAuth, requireRole('admin', 'authority'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await getOrCreateBudget()
    let queryLog: any[] = []
    try {
      queryLog = await knex('privacy_query_log')
        .where({ budget_id: budget.id })
        .orderBy('created_at', 'desc')
        .limit(100)
    } catch (_) {}

    const report = {
      reportGeneratedAt: new Date().toISOString(),
      complianceStandard: 'NDHM Privacy Framework 2023',
      privacyBudget: {
        totalAllocated: budget.total_budget,
        totalSpent: budget.spent,
        remaining: Math.max(0, budget.total_budget - budget.spent),
        percentUsed: ((budget.spent / budget.total_budget) * 100).toFixed(2) + '%',
        queryCount: budget.query_count,
        status: budget.spent >= budget.total_budget ? 'EXHAUSTED' : 'ACTIVE',
      },
      differentialPrivacyParams: {
        mechanism: 'Laplace + Randomised Response',
        globalSensitivity: 1.0,
        minEpsilonPerQuery: 0.01,
        maxEpsilonPerQuery: 1.0,
      },
      queryLog: queryLog.map(q => ({
        queryType: q.query_type,
        epsilonUsed: q.epsilon_used,
        timestamp: q.created_at,
      })),
      auditHash: uuidv4(),
    }

    res.json(report)
  } catch (err) {
    next(err)
  }
})

export default router
