"use strict";
// ============================================================
// src/types/index.ts — Shared backend types — OmniShield v2.0
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.UnauthorizedError = exports.RateLimitError = exports.InvalidCoordinatesError = exports.KeySignatureMismatchError = exports.PrivacyBudgetError = void 0;
// ── Custom typed errors → mapped to HTTP codes by errorHandler ─
class PrivacyBudgetError extends Error {
    constructor(epsilon) {
        super(`epsilon ${epsilon} outside valid range [0.5, 1.0]`);
        this.code = 'INVALID_PRIVACY_BUDGET';
        this.httpStatus = 422;
        this.name = 'PrivacyBudgetError';
    }
}
exports.PrivacyBudgetError = PrivacyBudgetError;
class KeySignatureMismatchError extends Error {
    constructor() {
        super('QR payload failed cryptographic validation');
        this.code = 'KEY_SIGNATURE_MISMATCH';
        this.httpStatus = 403;
        this.name = 'KeySignatureMismatchError';
    }
}
exports.KeySignatureMismatchError = KeySignatureMismatchError;
class InvalidCoordinatesError extends Error {
    constructor(lat, lon) {
        super(`Coordinates (${lat}, ${lon}) are outside valid WGS84 bounds`);
        this.code = 'INVALID_COORDINATES';
        this.httpStatus = 400;
        this.name = 'InvalidCoordinatesError';
    }
}
exports.InvalidCoordinatesError = InvalidCoordinatesError;
class RateLimitError extends Error {
    constructor() {
        super('Rate limit exceeded — try again later');
        this.code = 'RATE_LIMIT_EXCEEDED';
        this.httpStatus = 429;
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class UnauthorizedError extends Error {
    constructor(message = 'Authentication required') {
        super(message);
        this.code = 'UNAUTHORIZED';
        this.httpStatus = 401;
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends Error {
    constructor(message = 'Insufficient permissions') {
        super(message);
        this.code = 'FORBIDDEN';
        this.httpStatus = 403;
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
//# sourceMappingURL=index.js.map