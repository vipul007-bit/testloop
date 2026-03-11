/**
 * Strict limiter for POST /api/v1/surveillance/report
 * Max 5 reports per IP per hour — prevents abuse while allowing
 * legitimate multi-patient clinical sessions.
 */
export declare const reportRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Auth endpoint limiter — 5 attempts per 15 minutes per IP
 */
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * General API limiter — applied to all /api/ routes
 * Max 100 requests per 15 minutes per IP
 */
export declare const generalRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map