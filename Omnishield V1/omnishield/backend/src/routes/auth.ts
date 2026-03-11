// ============================================================
// src/routes/auth.ts — Authentication Routes
// POST /register · POST /login · POST /verify-mfa · GET /me
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import knex from '../db/knex'
import { authRateLimiter } from '../middleware/rateLimiter'
import { requireAuth, type JwtPayload, type UserRole } from '../middleware/auth'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET ?? 'omnishield-dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '24h'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['doctor', 'nurse', 'lab_tech', 'pharmacist', 'admin', 'authority']),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// POST /api/v1/auth/register
router.post('/register', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } })
    }
    const { email, password, fullName, role } = parsed.data

    // Check if user exists
    const existing = await knex('users').where({ email }).first()
    if (existing) {
      return res.status(409).json({ error: { code: 'USER_EXISTS', message: 'User with this email already exists', httpStatus: 409 } })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const userId = uuidv4()

    await knex('users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role,
      is_active: true,
      created_at: new Date(),
    })

    const payload: JwtPayload = { userId, email, role: role as UserRole, fullName }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any)

    // Audit log
    try {
      await knex('audit_logs').insert({
        id: uuidv4(),
        user_id: userId,
        action: 'REGISTER',
        resource_type: 'user',
        resource_id: userId,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] ?? '',
        created_at: new Date(),
      })
    } catch (_) {}

    res.status(201).json({ token, user: { id: userId, email, fullName, role } })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/login
router.post('/login', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = LoginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } })
    }
    const { email, password } = parsed.data

    const user = await knex('users').where({ email, is_active: true }).first()
    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', httpStatus: 401 } })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', httpStatus: 401 } })
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role, fullName: user.full_name }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any)

    // Audit log
    try {
      await knex('audit_logs').insert({
        id: uuidv4(),
        user_id: user.id,
        action: 'LOGIN',
        resource_type: 'user',
        resource_id: user.id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] ?? '',
        created_at: new Date(),
      })
    } catch (_) {}

    res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/verify-mfa
router.post('/verify-mfa', requireAuth, async (req: Request, res: Response) => {
  const { token: totpToken } = req.body
  if (!totpToken) {
    return res.status(400).json({ error: { code: 'MISSING_TOKEN', message: 'TOTP token required', httpStatus: 400 } })
  }
  // In production, use otplib to verify. For demo, accept any 6-digit code
  const isValid = /^\d{6}$/.test(totpToken)
  if (!isValid) {
    return res.status(401).json({ error: { code: 'INVALID_MFA', message: 'Invalid MFA token', httpStatus: 401 } })
  }
  res.json({ verified: true, message: 'MFA verification successful' })
})

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await knex('users').where({ id: req.user!.userId }).select('id', 'email', 'full_name', 'role', 'is_active', 'created_at').first()
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found', httpStatus: 404 } })
    }
    res.json({ id: user.id, email: user.email, fullName: user.full_name, role: user.role, isActive: user.is_active, createdAt: user.created_at })
  } catch (err) {
    next(err)
  }
})

export default router
