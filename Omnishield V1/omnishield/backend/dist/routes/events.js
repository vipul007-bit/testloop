"use strict";
// ============================================================
// src/routes/events.ts — Real-Time Event Streaming (SSE)
// POST /publish · GET /stream · GET /recent
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const knex_1 = __importDefault(require("../db/knex"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// In-memory SSE clients
const sseClients = new Set();
// In-memory recent events (last 50)
const recentEvents = [];
function broadcastEvent(event) {
    const data = JSON.stringify(event);
    sseClients.forEach(client => {
        try {
            client.write(`data: ${data}\n\n`);
        }
        catch (_) {
            sseClients.delete(client);
        }
    });
}
// POST /api/v1/events/publish
router.post('/publish', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { eventType, payload, sourceFacility, geoLat, geoLon, severity } = req.body;
        if (!eventType || !payload) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'eventType and payload required', httpStatus: 400 } });
        }
        const id = (0, uuid_1.v4)();
        const event = {
            id,
            eventType,
            payload,
            sourceFacility: sourceFacility ?? 'Unknown',
            geoLat: geoLat ?? 0,
            geoLon: geoLon ?? 0,
            severity: severity ?? 'INFO',
            createdAt: new Date().toISOString(),
        };
        recentEvents.unshift(event);
        if (recentEvents.length > 50)
            recentEvents.pop();
        try {
            await (0, knex_1.default)('healthcare_events').insert({
                id,
                event_type: eventType,
                payload: JSON.stringify(payload),
                source_facility: event.sourceFacility,
                geo_lat: event.geoLat,
                geo_lon: event.geoLon,
                severity: event.severity,
                created_at: new Date(),
            });
        }
        catch (_) { }
        broadcastEvent(event);
        res.status(201).json({ published: true, eventId: id });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/events/stream (SSE)
router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();
    // Send welcome event
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'OmniShield event stream connected', timestamp: new Date().toISOString() })}\n\n`);
    sseClients.add(res);
    // Keepalive every 15s
    const keepalive = setInterval(() => {
        try {
            res.write(': keepalive\n\n');
        }
        catch (_) {
            clearInterval(keepalive);
            sseClients.delete(res);
        }
    }, 15000);
    req.on('close', () => {
        clearInterval(keepalive);
        sseClients.delete(res);
    });
});
// GET /api/v1/events/recent
router.get('/recent', auth_1.requireAuth, async (_req, res, next) => {
    try {
        let events = [...recentEvents];
        if (events.length === 0) {
            // Return mock events
            const types = ['diagnosis', 'admission', 'lab_result', 'prescription', 'pharmacy_purchase'];
            const facilities = ['AIIMS New Delhi', 'Fortis Hospital Mumbai', 'Apollo Chennai', 'Manipal Bengaluru'];
            events = Array.from({ length: 20 }, (_, i) => ({
                id: (0, uuid_1.v4)(),
                eventType: types[i % types.length],
                payload: { icdCode: 'A90', patientId: (0, uuid_1.v4)() },
                sourceFacility: facilities[i % facilities.length],
                geoLat: 20 + Math.random() * 10,
                geoLon: 73 + Math.random() * 15,
                severity: i % 5 === 0 ? 'CRITICAL' : i % 3 === 0 ? 'HIGH' : 'INFO',
                createdAt: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
            }));
        }
        res.json({ events, total: events.length });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=events.js.map