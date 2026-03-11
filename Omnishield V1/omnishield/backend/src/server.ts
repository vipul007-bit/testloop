// ============================================================
// src/server.ts — OmniShield Backend Entry Point
// ============================================================

import 'dotenv/config'
import http from 'http'
import app from './app'
import { initWebSocket } from './routes/websocket'
import { initPgListener } from './db/pgListener'

const PORT = parseInt(process.env.PORT ?? '3001', 10)

const server = http.createServer(app)

// Initialise WebSocket server (shares the HTTP server)
const wss = initWebSocket(server)

// Listen for PostgreSQL NOTIFY events and broadcast to WS clients
initPgListener(wss)

server.listen(PORT, () => {
  console.log(`\n🛡️  OmniShield Backend running`)
  console.log(`   HTTP  → http://localhost:${PORT}`)
  console.log(`   WS    → ws://localhost:${PORT}/ws/clusters`)
  console.log(`   ENV   → ${process.env.NODE_ENV ?? 'development'}\n`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully')
  server.close(() => process.exit(0))
})
