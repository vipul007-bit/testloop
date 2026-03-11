// ============================================================
// src/middleware/errorHandler.ts
// Centralised Express error handler
// Maps typed errors → standard ApiErrorResponse HTTP codes
// ============================================================

import type { Request, Response, NextFunction } from 'express'
import {
  PrivacyBudgetError,
  KeySignatureMismatchError,
  InvalidCoordinatesError,
  RateLimitError,
} from '../types'

// All error responses conform to ApiErrorResponse interface
interface ApiErrorBody {
  error: {
    code: string
    message: string
    httpStatus: number
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log full stack server-side — NEVER expose internals in the response body
  console.error('[ErrorHandler]', err.name, err.message)
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  let body: ApiErrorBody
  let status: number

  if (err instanceof PrivacyBudgetError) {
    // 422 — epsilon outside [0.5, 1.0]
    // PWA: permanent failure — remove from queue, do not retry
    status = 422
    body = { error: { code: err.code, message: err.message, httpStatus: 422 } }

  } else if (err instanceof KeySignatureMismatchError) {
    // 403 — QR payload failed crypto validation
    // PWA: permanent failure — trigger QR re-scan flow
    status = 403
    body = { error: { code: err.code, message: err.message, httpStatus: 403 } }

  } else if (err instanceof RateLimitError) {
    // 429 — too many requests
    // PWA: transient — retry with exponential backoff
    status = 429
    res.setHeader('Retry-After', '3600') // 1 hour
    body = { error: { code: err.code, message: err.message, httpStatus: 429 } }

  } else if (err instanceof InvalidCoordinatesError) {
    // 400 — malformed request
    status = 400
    body = { error: { code: err.code, message: err.message, httpStatus: 400 } }

  } else {
    // 500 — unexpected server error (never expose details)
    status = 500
    body = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        httpStatus: 500,
      },
    }
  }

  res.status(status).json(body)
}
