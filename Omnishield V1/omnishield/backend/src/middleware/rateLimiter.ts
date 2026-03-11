// ============================================================
// src/middleware/rateLimiter.ts
// express-rate-limit configuration for OmniShield endpoints
// ============================================================

import rateLimit from 'express-rate-limit'

/**
 * Strict limiter for POST /api/v1/surveillance/report
 * Max 5 reports per IP per hour — prevents abuse while allowing
 * legitimate multi-patient clinical sessions.
 */
export const reportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_REPORTS_PER_HOUR ?? '5', 10),
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many surveillance reports from this IP. Maximum 5 per hour.',
      httpStatus: 429,
    },
  },
  skip: (_req) => process.env.NODE_ENV === 'test',
})

/**
 * Auth endpoint limiter — 5 attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      httpStatus: 429,
    },
  },
})

/**
 * General API limiter — applied to all /api/ routes
 * Max 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_GENERAL ?? '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
      httpStatus: 429,
    },
  },
})
