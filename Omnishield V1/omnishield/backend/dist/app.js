"use strict";
// ============================================================
// src/app.ts — Express application setup — OmniShield v2.0
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const surveillance_1 = __importDefault(require("./routes/surveillance"));
const auth_1 = __importDefault(require("./routes/auth"));
const abha_1 = __importDefault(require("./routes/abha"));
const epidemic_1 = __importDefault(require("./routes/epidemic"));
const privacy_1 = __importDefault(require("./routes/privacy"));
const fhir_1 = __importDefault(require("./routes/fhir"));
const events_1 = __importDefault(require("./routes/events"));
const federated_1 = __importDefault(require("./routes/federated"));
const cdss_1 = __importDefault(require("./routes/cdss"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const chatbot_1 = __importDefault(require("./routes/chatbot"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const app = (0, express_1.default)();
// ── Security headers ──────────────────────────────────────────
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://api.anthropic.com'],
        },
    },
}));
// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map(s => s.trim());
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin))
            return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
// ── Body parsing ──────────────────────────────────────────────
app.use(express_1.default.json({ limit: '16kb' }));
app.use((0, compression_1.default)());
// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
// ── General rate limit ────────────────────────────────────────
app.use('/api/', rateLimiter_1.generalRateLimiter);
// ── Routes ────────────────────────────────────────────────────
app.use('/api/v1/surveillance', surveillance_1.default);
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/abha', abha_1.default);
app.use('/api/v1/epidemic', epidemic_1.default);
app.use('/api/v1/privacy', privacy_1.default);
app.use('/api/v1/fhir', fhir_1.default);
app.use('/api/v1/events', events_1.default);
app.use('/api/v1/federated', federated_1.default);
app.use('/api/v1/cdss', cdss_1.default);
app.use('/api/v1/analytics', analytics_1.default);
app.use('/api/v1/chatbot', chatbot_1.default);
// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});
// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found', httpStatus: 404 } });
});
// ── Centralised error handler ─────────────────────────────────
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map