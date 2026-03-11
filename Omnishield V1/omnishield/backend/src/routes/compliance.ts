// ============================================================
// src/routes/compliance.ts — HIPAA/GDPR/NDHM Compliance Endpoints
// ============================================================

import { Router, Request, Response } from 'express'
import {
  checkHIPAACompliance,
  checkGDPRCompliance,
  checkNDHMCompliance,
  generateComplianceDashboard,
} from '../services/complianceService'

const router = Router()

// GET /api/v1/compliance/dashboard
router.get('/dashboard', (_req: Request, res: Response): void => {
  const dashboard = generateComplianceDashboard()
  res.json(dashboard)
})

// GET /api/v1/compliance/hipaa
router.get('/hipaa', (req: Request, res: Response): void => {
  const operation = (req.query.operation as string | undefined) ?? 'read'
  const dataType = (req.query.dataType as string | undefined) ?? 'PHI'
  const checks = checkHIPAACompliance(operation, dataType)
  const score = Math.round(checks.filter(c => c.status === 'Compliant').length / checks.length * 100)
  res.json({ framework: 'HIPAA Security Rule', operation, dataType, score, checks })
})

// GET /api/v1/compliance/gdpr
router.get('/gdpr', (req: Request, res: Response): void => {
  const operation = (req.query.operation as string | undefined) ?? 'read'
  const dataSubject = (req.query.dataSubject as string | undefined) ?? 'patient'
  const checks = checkGDPRCompliance(operation, dataSubject)
  const score = Math.round(checks.filter(c => c.status === 'Compliant').length / checks.length * 100)
  res.json({ framework: 'GDPR', operation, dataSubject, score, checks })
})

// GET /api/v1/compliance/ndhm
router.get('/ndhm', (req: Request, res: Response): void => {
  const operation = (req.query.operation as string | undefined) ?? 'read'
  const checks = checkNDHMCompliance(operation)
  const score = Math.round(checks.filter(c => c.status === 'Compliant').length / checks.length * 100)
  res.json({ framework: 'NDHM Health Data Management Policy', operation, score, checks })
})

export default router
