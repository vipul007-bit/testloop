// ============================================================
// src/routes/websocket.ts
// WebSocket server — real-time cluster update broadcasting
// Connected clients receive ClusterFeature JSON on every
// PostgreSQL pg_notify('cluster_update', ...) event.
// ============================================================

import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'

export function initWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: process.env.WS_PATH ?? '/ws/clusters',
  })

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress
    console.log(`[WebSocket] Client connected from ${ip}. Total: ${wss.clients.size}`)

    // Send welcome message with current timestamp
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'OmniShield real-time surveillance feed',
      timestamp: new Date().toISOString(),
    }))

    // Ping/pong keepalive every 30s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping()
    }, 30_000)

    ws.on('pong', () => {
      // Client is still alive
    })

    ws.on('close', () => {
      clearInterval(pingInterval)
      console.log(`[WebSocket] Client disconnected. Total: ${wss.clients.size}`)
    })

    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err.message)
      clearInterval(pingInterval)
    })
  })

  wss.on('error', (err) => {
    console.error('[WebSocket] Server error:', err.message)
  })

  console.log(`[WebSocket] Server ready on path: ${process.env.WS_PATH ?? '/ws/clusters'}`)
  return wss
}
