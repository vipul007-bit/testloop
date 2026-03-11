"use strict";
// ============================================================
// src/server.ts — OmniShield Backend Entry Point
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const websocket_1 = require("./routes/websocket");
const pgListener_1 = require("./db/pgListener");
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const server = http_1.default.createServer(app_1.default);
// Initialise WebSocket server (shares the HTTP server)
const wss = (0, websocket_1.initWebSocket)(server);
// Listen for PostgreSQL NOTIFY events and broadcast to WS clients
(0, pgListener_1.initPgListener)(wss);
server.listen(PORT, () => {
    console.log(`\n🛡️  OmniShield Backend running`);
    console.log(`   HTTP  → http://localhost:${PORT}`);
    console.log(`   WS    → ws://localhost:${PORT}/ws/clusters`);
    console.log(`   ENV   → ${process.env.NODE_ENV ?? 'development'}\n`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received — shutting down gracefully');
    server.close(() => process.exit(0));
});
//# sourceMappingURL=server.js.map