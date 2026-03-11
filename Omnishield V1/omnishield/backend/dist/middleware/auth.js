"use strict";
// ============================================================
// src/middleware/auth.ts — JWT Authentication & RBAC Middleware
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET ?? 'omnishield-dev-secret-change-in-production';
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header', httpStatus: 401 } });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token', httpStatus: 401 } });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required', httpStatus: 401 } });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: { code: 'FORBIDDEN', message: `Access denied. Required role: ${roles.join(' or ')}`, httpStatus: 403 } });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map