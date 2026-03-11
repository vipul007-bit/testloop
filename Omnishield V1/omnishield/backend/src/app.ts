// ============================================================
// src/app.ts — Express application setup
// ============================================================

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'

import surveillanceRouter from './routes/surveillance'
import authRouter from './routes/auth'
import epidemicRouter from './routes/epidemic'
import privacyRouter from './routes/privacy'
import fhirRouter from './routes/fhir'
import eventsRouter from './routes/events'
import federatedRouter from './routes/federated'
import cdssRouter from './routes/cdss'
import analyticsRouter from './routes/analytics'
import complianceRouter from './routes/compliance'
import { errorHandler } from './middleware/errorHandler'
import { generalRateLimiter } from './middleware/rateLimiter'
import { auditLogger } from './middleware/auditLogger'

const app = express()

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
    },
  },
}))

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(s => s.trim())

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }))
app.use(compression())

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ── General rate limit ────────────────────────────────────────
app.use('/api/', generalRateLimiter)

// ── Audit logging ─────────────────────────────────────────────
app.use('/api/', auditLogger)

// ── Routes ────────────────────────────────────────────────────
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/surveillance', surveillanceRouter)
app.use('/api/v1/epidemic', epidemicRouter)
app.use('/api/v1/privacy', privacyRouter)
app.use('/api/v1/fhir', fhirRouter)
app.use('/api/v1/events', eventsRouter)
app.use('/api/v1/federated', federatedRouter)
app.use('/api/v1/cdss', cdssRouter)
app.use('/api/v1/analytics', analyticsRouter)
app.use('/api/v1/compliance', complianceRouter)

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      auth: 'ok',
      surveillance: 'ok',
      epidemic: 'ok',
      privacy: 'ok',
      fhir: 'ok',
      events: 'ok',
      federated: 'ok',
      cdss: 'ok',
      analytics: 'ok',
      compliance: 'ok',
    },
  })
})

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found', httpStatus: 404 } })
})

// ── Centralised error handler ─────────────────────────────────
app.use(errorHandler)

export default app
