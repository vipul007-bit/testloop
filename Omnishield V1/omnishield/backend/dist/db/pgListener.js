"use strict";
// ============================================================
// src/db/pgListener.ts
// Listens for PostgreSQL NOTIFY on 'cluster_update' channel
// and broadcasts ClusterFeature JSON to all connected WS clients
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPgListener = initPgListener;
const pg_1 = __importDefault(require("pg"));
function initPgListener(wss) {
    const client = new pg_1.default.Client({
        connectionString: process.env.DATABASE_URL,
    });
    client.connect().then(() => {
        console.log('[PgListener] Connected — listening on channel: cluster_update');
        client.query('LISTEN cluster_update');
        client.on('notification', (msg) => {
            if (msg.channel !== 'cluster_update')
                return;
            const payload = msg.payload;
            console.log('[PgListener] NOTIFY received:', payload?.slice(0, 80));
            // Broadcast to all connected WebSocket clients
            let broadcast = 0;
            wss.clients.forEach((wsClient) => {
                if (wsClient.readyState === 1 /* OPEN */) {
                    wsClient.send(payload ?? '{}');
                    broadcast++;
                }
            });
            console.log(`[PgListener] Broadcasted to ${broadcast} WS client(s)`);
        });
        client.on('error', (err) => {
            console.error('[PgListener] PostgreSQL error:', err.message);
            // Reconnect after 5 seconds
            setTimeout(() => initPgListener(wss), 5000);
        });
    }).catch((err) => {
        console.error('[PgListener] Failed to connect:', err.message);
        setTimeout(() => initPgListener(wss), 5000);
    });
}
//# sourceMappingURL=pgListener.js.map