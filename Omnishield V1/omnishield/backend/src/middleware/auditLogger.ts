// ============================================================
// src/middleware/auditLogger.ts — Audit Logging Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express'

export interface AuditEntry {
  id: string
  userId: string | null
  action: string
  resource: string
  ip: string
  timestamp: string
  statusCode: number
  userAgent: string
  method: string
  path: string
}

// ── Ring buffer (max 1000 entries) ────────────────────────────
const RING_SIZE = 1000
const auditBuffer: AuditEntry[] = []

function pushEntry(entry: AuditEntry): void {
  if (auditBuffer.length >= RING_SIZE) {
    auditBuffer.shift()
  }
  auditBuffer.push(entry)
}

let entryCounter = 0

// ── Middleware ────────────────────────────────────────────────
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  const startTs = Date.now()

  res.on('finish', () => {
    const userId =
      (req as Request & { user?: { id: string } }).user?.id ?? null

    const entry: AuditEntry = {
      id: `audit-${++entryCounter}-${startTs}`,
      userId,
      action: `${req.method} ${req.path}`,
      resource: req.path,
      ip: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown',
      timestamp: new Date(startTs).toISOString(),
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent'] ?? 'unknown',
      method: req.method,
      path: req.originalUrl,
    }

    pushEntry(entry)
  })

  next()
}

// ── Query helpers ─────────────────────────────────────────────
export function getAuditLogs(limit = 100): AuditEntry[] {
  return auditBuffer.slice(-Math.min(limit, RING_SIZE))
}

export function getAuditLogsByUser(userId: string, limit = 50): AuditEntry[] {
  return auditBuffer.filter(e => e.userId === userId).slice(-limit)
}
