// ============================================================
// src/middleware/authMiddleware.ts — JWT Verification & RBAC
// ============================================================

import { Request, Response, NextFunction } from 'express'
import { verifyJWT } from '../routes/auth'
import type { UserRole } from '../routes/auth'

// ── Extended Request type ─────────────────────────────────────
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: UserRole
    abhaId?: string
  }
}

// ── JWT verification middleware ────────────────────────────────
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header',
        httpStatus: 401,
      },
    })
    return
  }

  const token = authHeader.slice(7)
  const payload = verifyJWT(token)

  if (!payload) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        httpStatus: 401,
      },
    })
    return
  }

  if (
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.role !== 'string'
  ) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token payload malformed',
        httpStatus: 401,
      },
    })
    return
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role as UserRole,
    abhaId: typeof payload.abhaId === 'string' ? payload.abhaId : undefined,
  }

  next()
}

// ── Role-based access control helpers ─────────────────────────

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated', httpStatus: 401 },
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access restricted to: ${roles.join(', ')}`,
          httpStatus: 403,
        },
      })
      return
    }

    next()
  }
}

export function requireAnyRole(...roles: UserRole[]) {
  return requireRole(...roles)
}
