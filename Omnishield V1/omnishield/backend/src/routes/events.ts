// ============================================================
// src/routes/events.ts — Server-Sent Events (SSE) Endpoints
// ============================================================

import { Router, Request, Response } from 'express'
import { eventBus, EventPayload, EventTopic, SubscribableTopic } from '../services/eventBus'
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware'

const router = Router()

// GET /api/v1/events/stream — SSE endpoint (authenticated users only)
router.get('/stream', authenticateJWT, (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'OmniShield event stream connected', timestamp: new Date().toISOString() })}\n\n`)

  // Send recent history on connect
  const history = eventBus.getEventHistory(10)
  if (history.length > 0) {
    res.write(`event: history\ndata: ${JSON.stringify({ events: history })}\n\n`)
  }

  // Subscribe to all topics via wildcard
  const unsubscribe = eventBus.subscribe('*' as SubscribableTopic, (payload: EventPayload) => {
    res.write(`event: ${payload.topic}\ndata: ${JSON.stringify(payload)}\n\n`)
  })

  // Heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${new Date().toISOString()}\n\n`)
  }, 30_000)

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
    res.end()
  })
})

// GET /api/v1/events/history — Recent event history (authenticated users)
router.get('/history', authenticateJWT, (req: Request, res: Response): void => {
  const limit = Math.min(parseInt(req.query.limit as string ?? '50', 10), 500)
  const topic = req.query.topic as string | undefined

  const events = topic
    ? eventBus.getEventsByTopic(topic as EventTopic, limit)
    : eventBus.getEventHistory(limit)

  res.json({
    total: events.length,
    limit,
    events,
  })
})

// POST /api/v1/events/publish — Publish event (Authority/HospitalAdmin only)
router.post('/publish', authenticateJWT, requireRole('Authority', 'HospitalAdmin'), (req: AuthenticatedRequest, res: Response): void => {
  const { topic, data, source } = req.body as { topic?: string; data?: Record<string, unknown>; source?: string }

  const validTopics: EventTopic[] = [
    'patient.diagnosis', 'hospital.admission', 'lab.result',
    'prescription.update', 'pharmacy.purchase', 'outbreak.alert',
  ]

  if (!topic || !validTopics.includes(topic as EventTopic)) {
    res.status(400).json({ error: 'Invalid or missing topic', validTopics })
    return
  }

  const publisherSource = source ?? req.user?.email ?? 'api'
  const payload = eventBus.publish(topic as EventTopic, data ?? {}, publisherSource)
  res.json({ published: true, payload })
})

export default router
