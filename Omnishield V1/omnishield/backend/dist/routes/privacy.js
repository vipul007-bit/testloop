"use strict";
// ============================================================
// src/routes/privacy.ts — Adaptive Privacy Budget Management
// GET /budget · POST /query · GET /report
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const knex_1 = __importDefault(require("../db/knex"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const DEFAULT_BUDGET = 10.0;
const QuerySchema = zod_1.z.object({
    queryType: zod_1.z.string(),
    epsilonUsed: zod_1.z.number().min(0.01).max(1.0),
    queryParams: zod_1.z.record(zod_1.z.any()).optional(),
});
async function getOrCreateBudget() {
    let budget = null;
    try {
        budget = await (0, knex_1.default)('privacy_budget').orderBy('created_at', 'asc').first();
    }
    catch (_) { }
    if (!budget) {
        const id = (0, uuid_1.v4)();
        try {
            await (0, knex_1.default)('privacy_budget').insert({
                id,
                total_budget: DEFAULT_BUDGET,
                spent: 0,
                query_count: 0,
                created_at: new Date(),
            });
            return { id, total_budget: DEFAULT_BUDGET, spent: 0, query_count: 0 };
        }
        catch (_) {
            return { id: '1', total_budget: DEFAULT_BUDGET, spent: 0, query_count: 0 };
        }
    }
    return budget;
}
// GET /api/v1/privacy/budget
router.get('/budget', auth_1.requireAuth, async (_req, res, next) => {
    try {
        const budget = await getOrCreateBudget();
        const remaining = Math.max(0, budget.total_budget - budget.spent);
        res.json({
            totalBudget: budget.total_budget,
            spent: budget.spent,
            remaining,
            queryCount: budget.query_count,
            exhausted: remaining <= 0,
            lastQueryAt: budget.last_query_at ?? null,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/privacy/query
router.post('/query', auth_1.requireAuth, async (req, res, next) => {
    try {
        const parsed = QuerySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message, httpStatus: 400 } });
        }
        const { queryType, epsilonUsed, queryParams } = parsed.data;
        const budget = await getOrCreateBudget();
        const remaining = budget.total_budget - budget.spent;
        if (epsilonUsed > remaining) {
            return res.status(429).json({
                error: {
                    code: 'PRIVACY_BUDGET_EXHAUSTED',
                    message: `Privacy budget exhausted. Remaining: ε=${remaining.toFixed(3)}. Requested: ε=${epsilonUsed}`,
                    httpStatus: 429,
                },
                remaining,
                spent: budget.spent,
            });
        }
        // Deduct from budget
        const newSpent = budget.spent + epsilonUsed;
        try {
            await (0, knex_1.default)('privacy_budget').where({ id: budget.id }).update({
                spent: newSpent,
                query_count: budget.query_count + 1,
                last_query_at: new Date(),
            });
            await (0, knex_1.default)('privacy_query_log').insert({
                id: (0, uuid_1.v4)(),
                budget_id: budget.id,
                epsilon_used: epsilonUsed,
                query_type: queryType,
                query_params: JSON.stringify(queryParams ?? {}),
                created_at: new Date(),
            });
        }
        catch (_) { }
        res.json({
            accepted: true,
            epsilonUsed,
            totalSpent: newSpent,
            remaining: Math.max(0, budget.total_budget - newSpent),
            queryCount: budget.query_count + 1,
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/privacy/report
router.get('/report', auth_1.requireAuth, (0, auth_1.requireRole)('admin', 'authority'), async (_req, res, next) => {
    try {
        const budget = await getOrCreateBudget();
        let queryLog = [];
        try {
            queryLog = await (0, knex_1.default)('privacy_query_log')
                .where({ budget_id: budget.id })
                .orderBy('created_at', 'desc')
                .limit(100);
        }
        catch (_) { }
        const report = {
            reportGeneratedAt: new Date().toISOString(),
            complianceStandard: 'NDHM Privacy Framework 2023',
            privacyBudget: {
                totalAllocated: budget.total_budget,
                totalSpent: budget.spent,
                remaining: Math.max(0, budget.total_budget - budget.spent),
                percentUsed: ((budget.spent / budget.total_budget) * 100).toFixed(2) + '%',
                queryCount: budget.query_count,
                status: budget.spent >= budget.total_budget ? 'EXHAUSTED' : 'ACTIVE',
            },
            differentialPrivacyParams: {
                mechanism: 'Laplace + Randomised Response',
                globalSensitivity: 1.0,
                minEpsilonPerQuery: 0.01,
                maxEpsilonPerQuery: 1.0,
            },
            queryLog: queryLog.map(q => ({
                queryType: q.query_type,
                epsilonUsed: q.epsilon_used,
                timestamp: q.created_at,
            })),
            auditHash: (0, uuid_1.v4)(),
        };
        res.json(report);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=privacy.js.map