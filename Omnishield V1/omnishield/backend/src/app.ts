// ============================================================
// src/app.ts — Express application setup
// ============================================================

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'

import surveillanceRouter from './routes/surveillance'
import { errorHandler } from './middleware/errorHandler'
import { generalRateLimiter } from './middleware/rateLimiter'

const app = express()

// ── Security headers ──────────────────────────────────────────
app.use(helmet())

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
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

// ── Routes ────────────────────────────────────────────────────
app.use('/api/v1/surveillance', surveillanceRouter)

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found', httpStatus: 404 } })
})

// ── Centralised error handler ─────────────────────────────────
app.use(errorHandler)

export default app
