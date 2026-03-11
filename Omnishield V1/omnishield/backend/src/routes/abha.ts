// ============================================================
// src/routes/abha.ts — ABHA Integration Routes
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import knex from '../db/knex'
import { requireAuth } from '../middleware/auth'

const router = Router()

const AbhaVerifySchema = z.object({
  abhaId: z.string().regex(/^\d{14}$/, 'ABHA ID must be exactly 14 digits'),
})

const LinkCardSchema = z.object({
  abhaId: z.string().regex(/^\d{14}$/),
  qrHash: z.string().length(64),
  patientName: z.string().min(2),
  dob: z.string(),
  gender: z.enum(['M', 'F', 'O']),
})

// Mock patient profiles for demo
function generateMockPatient(abhaId: string) {
  const names = ['Priya Sharma', 'Rajesh Kumar', 'Ananya Singh', 'Vikram Patel', 'Meera Nair']
  const idx = parseInt(abhaId.slice(-1)) % names.length
  return {
    abhaId,
    patientName: names[idx],
    dob: '1990-05-15',
    gender: idx % 2 === 0 ? 'F' : 'M',
    bloodGroup: ['A+', 'B+', 'O+', 'AB+'][idx % 4],
    address: 'New Delhi, India',
    phone: '+91 98765 ' + abhaId.slice(-5),
    linkedFacilities: ['AIIMS New Delhi', 'Fortis Hospital'],
    lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

// POST /api/v1/abha/verify
router.post('/verify', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AbhaVerifySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid ABHA ID. Must be exactly 14 digits.', httpStatus: 400 } })
    }
    const { abhaId } = parsed.data

    // Check if exists in DB first
    let card = null
    try {
      card = await knex('abha_cards').where({ abha_id: abhaId }).first()
    } catch (_) {}

    if (card) {
      const geoLogs = card.geo_access_logs ?? []
      return res.json({ found: true, abhaId, ...card, geoAccessLogs: geoLogs })
    }

    // Return mock patient data
    const mockProfile = generateMockPatient(abhaId)
    res.json({ found: false, verified: true, ...mockProfile })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/abha/link-card
router.post('/link-card', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = LinkCardSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } })
    }
    const { abhaId, qrHash, patientName, dob, gender } = parsed.data

    let card = null
    try {
      card = await knex('abha_cards').where({ abha_id: abhaId }).first()
    } catch (_) {}

    if (card) {
      await knex('abha_cards').where({ abha_id: abhaId }).update({ linked_qr_hash: qrHash })
    } else {
      await knex('abha_cards').insert({
        id: uuidv4(),
        abha_id: abhaId,
        patient_name: patientName,
        dob,
        gender,
        linked_qr_hash: qrHash,
        geo_access_logs: JSON.stringify([]),
        created_at: new Date(),
      })
    }
    res.json({ linked: true, abhaId, message: 'QR card linked to ABHA ID successfully' })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/abha/:abhaId/care-pathway
router.get('/:abhaId/care-pathway', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { abhaId } = req.params
    if (!/^\d{14}$/.test(abhaId)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid ABHA ID format', httpStatus: 400 } })
    }

    let pathway: any[] = []
    try {
      pathway = await knex('care_pathway')
        .where({ abha_id: abhaId })
        .orderBy('visited_at', 'desc')
        .limit(50)
    } catch (_) {}

    if (pathway.length === 0) {
      // Return mock care pathway
      pathway = [
        { id: uuidv4(), abha_id: abhaId, facility_name: 'AIIMS New Delhi', facility_type: 'gov', visit_type: 'OPD', icd_code: 'A90', provider_role: 'doctor', geo_lat: 28.5672, geo_lon: 77.2100, notes_encrypted: null, visited_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: uuidv4(), abha_id: abhaId, facility_name: 'SRL Diagnostics', facility_type: 'private', visit_type: 'Lab', icd_code: 'A90', provider_role: 'lab_tech', geo_lat: 28.5921, geo_lon: 77.2220, notes_encrypted: null, visited_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
        { id: uuidv4(), abha_id: abhaId, facility_name: 'Fortis Hospital Mumbai', facility_type: 'private', visit_type: 'IPD', icd_code: 'J18.9', provider_role: 'doctor', geo_lat: 19.0760, geo_lon: 72.8777, notes_encrypted: null, visited_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      ]
    }

    res.json({ abhaId, pathway, totalVisits: pathway.length })
  } catch (err) {
    next(err)
  }
})

export default router
