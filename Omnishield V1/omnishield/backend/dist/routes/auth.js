"use strict";
// ============================================================
// src/routes/auth.ts — Authentication Routes
// POST /register · POST /login · POST /verify-mfa · GET /me
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const knex_1 = __importDefault(require("../db/knex"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET ?? 'omnishield-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '24h';
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    fullName: zod_1.z.string().min(2),
    role: zod_1.z.enum(['doctor', 'nurse', 'lab_tech', 'pharmacist', 'admin', 'authority']),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
// POST /api/v1/auth/register
router.post('/register', rateLimiter_1.authRateLimiter, async (req, res, next) => {
    try {
        const parsed = RegisterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } });
        }
        const { email, password, fullName, role } = parsed.data;
        // Check if user exists
        const existing = await (0, knex_1.default)('users').where({ email }).first();
        if (existing) {
            return res.status(409).json({ error: { code: 'USER_EXISTS', message: 'User with this email already exists', httpStatus: 409 } });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const userId = (0, uuid_1.v4)();
        await (0, knex_1.default)('users').insert({
            id: userId,
            email,
            password_hash: passwordHash,
            full_name: fullName,
            role,
            is_active: true,
            created_at: new Date(),
        });
        const payload = { userId, email, role: role, fullName };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Audit log
        try {
            await (0, knex_1.default)('audit_logs').insert({
                id: (0, uuid_1.v4)(),
                user_id: userId,
                action: 'REGISTER',
                resource_type: 'user',
                resource_id: userId,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'] ?? '',
                created_at: new Date(),
            });
        }
        catch (_) { }
        res.status(201).json({ token, user: { id: userId, email, fullName, role } });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/auth/login
router.post('/login', rateLimiter_1.authRateLimiter, async (req, res, next) => {
    try {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } });
        }
        const { email, password } = parsed.data;
        const user = await (0, knex_1.default)('users').where({ email, is_active: true }).first();
        if (!user) {
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', httpStatus: 401 } });
        }
        const valid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', httpStatus: 401 } });
        }
        const payload = { userId: user.id, email: user.email, role: user.role, fullName: user.full_name };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Audit log
        try {
            await (0, knex_1.default)('audit_logs').insert({
                id: (0, uuid_1.v4)(),
                user_id: user.id,
                action: 'LOGIN',
                resource_type: 'user',
                resource_id: user.id,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'] ?? '',
                created_at: new Date(),
            });
        }
        catch (_) { }
        res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/auth/verify-mfa
router.post('/verify-mfa', auth_1.requireAuth, async (req, res) => {
    const { token: totpToken } = req.body;
    if (!totpToken) {
        return res.status(400).json({ error: { code: 'MISSING_TOKEN', message: 'TOTP token required', httpStatus: 400 } });
    }
    // In production, use otplib to verify. For demo, accept any 6-digit code
    const isValid = /^\d{6}$/.test(totpToken);
    if (!isValid) {
        return res.status(401).json({ error: { code: 'INVALID_MFA', message: 'Invalid MFA token', httpStatus: 401 } });
    }
    res.json({ verified: true, message: 'MFA verification successful' });
});
// GET /api/v1/auth/me
router.get('/me', auth_1.requireAuth, async (req, res, next) => {
    try {
        const user = await (0, knex_1.default)('users').where({ id: req.user.userId }).select('id', 'email', 'full_name', 'role', 'is_active', 'created_at').first();
        if (!user) {
            return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found', httpStatus: 404 } });
        }
        res.json({ id: user.id, email: user.email, fullName: user.full_name, role: user.role, isActive: user.is_active, createdAt: user.created_at });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map