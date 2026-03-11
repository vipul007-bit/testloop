// ============================================================
// src/routes/auth.ts — JWT Authentication Routes
// ============================================================

import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { z } from 'zod'

const router = Router()

// ── Types ─────────────────────────────────────────────────────
export type UserRole = 'Doctor' | 'Nurse' | 'LabTechnician' | 'Pharmacist' | 'HospitalAdmin' | 'Authority'

export interface StoredUser {
  id: string
  email: string
  passwordHash: string
  salt: string
  role: UserRole
  abhaId?: string
  mfaSecret?: string
  mfaEnabled: boolean
  createdAt: string
}

// ── In-memory stores ──────────────────────────────────────────
const users = new Map<string, StoredUser>()               // email → user
const usersById = new Map<string, StoredUser>()           // id → user
const refreshTokens = new Map<string, string>()           // token → userId
const mfaSecrets = new Map<string, string>()              // userId → totp secret

// ── JWT helpers (native crypto, no external dep) ──────────────
// ⚠️  SECURITY: In production, set JWT_SECRET env var to a cryptographically
//   random string of at least 64 characters. The fallback default MUST NOT
//   be used in production — it will log a warning below.
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: JWT_SECRET env var is not set in production. Exiting.')
      process.exit(1)
    }
    console.warn('⚠️  JWT_SECRET not set — using insecure development default. Set JWT_SECRET in production!')
    return 'omnishield-dev-secret-change-in-production'
  }
  return secret
})()

function b64url(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function b64urlDecode(data: string): string {
  const pad = data.length % 4
  const padded = pad ? data + '='.repeat(4 - pad) : data
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

function signJWT(payload: Record<string, unknown>, expiresIn: number): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresIn }))
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

export function verifyJWT(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null
  const payload = JSON.parse(b64urlDecode(body)) as Record<string, unknown>
  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}

// ── Password helpers (scrypt, no bcryptjs dep) ────────────────
function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { hash, salt }
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash))
}

// ── Zod schemas ───────────────────────────────────────────────
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['Doctor', 'Nurse', 'LabTechnician', 'Pharmacist', 'HospitalAdmin', 'Authority']),
  abhaId: z.string().optional(),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const MFAVerifySchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
})

const RefreshSchema = z.object({
  refreshToken: z.string(),
})

// ── Routes ────────────────────────────────────────────────────

// POST /api/v1/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const result = RegisterSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.issues })
    return
  }

  const { email, password, role, abhaId } = result.data

  if (users.has(email)) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  const { hash, salt } = hashPassword(password)
  const id = crypto.randomUUID()
  const user: StoredUser = {
    id,
    email,
    passwordHash: hash,
    salt,
    role,
    abhaId,
    mfaEnabled: false,
    createdAt: new Date().toISOString(),
  }

  users.set(email, user)
  usersById.set(id, user)

  res.status(201).json({
    message: 'User registered successfully',
    user: { id, email, role, abhaId, createdAt: user.createdAt },
  })
})

// POST /api/v1/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const result = LoginSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.issues })
    return
  }

  const { email, password } = result.data
  const user = users.get(email)

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const accessToken = signJWT({ sub: user.id, email: user.email, role: user.role, abhaId: user.abhaId }, 15 * 60)
  const refreshToken = crypto.randomBytes(40).toString('hex')
  refreshTokens.set(refreshToken, user.id)

  res.json({
    accessToken,
    refreshToken,
    expiresIn: 900,
    tokenType: 'Bearer',
    user: { id: user.id, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled },
  })
})

// POST /api/v1/auth/mfa/setup
router.post('/mfa/setup', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' })
    return
  }

  const payload = verifyJWT(authHeader.slice(7))
  if (!payload || typeof payload.sub !== 'string') {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  const user = usersById.get(payload.sub)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const secret = crypto.randomBytes(20).toString('hex').toUpperCase().slice(0, 32)
  mfaSecrets.set(user.id, secret)

  const qrUrl = `otpauth://totp/OmniShield:${encodeURIComponent(user.email)}?secret=${secret}&issuer=OmniShield`

  res.json({
    secret,
    qrUrl,
    message: 'Scan QR code with your authenticator app, then verify with /mfa/verify',
  })
})

// POST /api/v1/auth/mfa/verify
router.post('/mfa/verify', (req: Request, res: Response): void => {
  const result = MFAVerifySchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.issues })
    return
  }

  const { userId, code } = result.data

  // ⚠️  DEMO MODE: Any 6-digit code is accepted for hackathon demo purposes.
  //   In production, replace this with real TOTP validation using speakeasy or otplib:
  //   import speakeasy from 'speakeasy'
  //   const isValid = speakeasy.totp.verify({ secret: mfaSecrets.get(userId), token: code, encoding: 'base32' })
  const isValid = /^\d{6}$/.test(code) && mfaSecrets.has(userId)

  if (!isValid) {
    res.status(401).json({ error: 'Invalid MFA code' })
    return
  }

  const user = usersById.get(userId)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  user.mfaEnabled = true
  res.json({ message: 'MFA enabled successfully', mfaEnabled: true })
})

// POST /api/v1/auth/refresh
router.post('/refresh', (req: Request, res: Response): void => {
  const result = RefreshSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.issues })
    return
  }

  const { refreshToken } = result.data
  const userId = refreshTokens.get(refreshToken)

  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
    return
  }

  const user = usersById.get(userId)
  if (!user) {
    res.status(401).json({ error: 'User not found' })
    return
  }

  const accessToken = signJWT({ sub: user.id, email: user.email, role: user.role, abhaId: user.abhaId }, 15 * 60)

  res.json({ accessToken, expiresIn: 900, tokenType: 'Bearer' })
})

// POST /api/v1/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  const result = RefreshSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'refreshToken required' })
    return
  }

  refreshTokens.delete(result.data.refreshToken)
  res.json({ message: 'Logged out successfully' })
})

export default router
