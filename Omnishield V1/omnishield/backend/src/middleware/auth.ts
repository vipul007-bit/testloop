// ============================================================
// src/middleware/auth.ts — JWT Authentication & RBAC Middleware
// ============================================================

import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type UserRole = 'doctor' | 'nurse' | 'lab_tech' | 'pharmacist' | 'admin' | 'authority'

export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
  fullName: string
  iat?: number
  exp?: number
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'omnishield-dev-secret-change-in-production'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header', httpStatus: 401 } })
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token', httpStatus: 401 } })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required', httpStatus: 401 } })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: `Access denied. Required role: ${roles.join(' or ')}`, httpStatus: 403 } })
      return
    }
    next()
  }
}
