"use strict";
// ============================================================
// src/db/knex.ts — Knex.js PostgreSQL connection
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
const knex = (0, knex_1.default)({
    client: 'pg',
    connection: process.env.DATABASE_URL ?? {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        database: process.env.DB_NAME ?? 'omnishield_db',
        user: process.env.DB_USER ?? 'omnishield',
        password: process.env.DB_PASSWORD ?? '',
    },
    pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 600000,
    },
    searchPath: ['public'],
    asyncStackTraces: process.env.NODE_ENV !== 'production',
});
exports.default = knex;
//# sourceMappingURL=knex.js.map