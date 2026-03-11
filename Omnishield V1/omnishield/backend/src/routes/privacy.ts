// ============================================================
// src/routes/privacy.ts — Privacy Budget Endpoints
// ============================================================

import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware'
import { getBudgetStatus, allocateBudget, generateComplianceReport } from '../services/privacyBudget'

const router = Router()
router.use(authenticateJWT)

const AllocateSchema = z.object({
  sessionId: z.string().min(1),
  epsilon: z.number().positive(),
  operation: z.string().optional(),
})

// GET /api/v1/privacy/budget
router.get('/budget', (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id
  const sessionId = (req.query.sessionId as string | undefined) ?? 'default'
  const status = getBudgetStatus(userId, sessionId)
  res.json(status)
})

// POST /api/v1/privacy/allocate
router.post('/allocate', (req: AuthenticatedRequest, res: Response): void => {
  const result = AllocateSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.issues })
    return
  }

  const userId = req.user!.id
  const { sessionId, epsilon, operation } = result.data

  try {
    const approved = allocateBudget(userId, sessionId, epsilon, operation)
    const status = getBudgetStatus(userId, sessionId)
    res.json({ approved, ...status })
  } catch (err) {
    res.status(403).json({ error: (err as Error).message })
  }
})

// POST /api/v1/privacy/report
router.post('/report', (req: AuthenticatedRequest, res: Response): void => {
  const userId = (req.body as { userId?: string }).userId ?? req.user!.id
  // Non-admin users can only see their own report
  if (req.user!.role !== 'HospitalAdmin' && req.user!.role !== 'Authority' && userId !== req.user!.id) {
    res.status(403).json({ error: 'Access denied' })
    return
  }
  const report = generateComplianceReport(userId)
  res.json(report)
})

export default router
