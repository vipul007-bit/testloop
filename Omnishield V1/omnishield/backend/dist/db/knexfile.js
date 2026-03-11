"use strict";
// ============================================================
// src/db/knexfile.ts — Knex migration configuration
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    development: {
        client: 'pg',
        connection: process.env.DATABASE_URL ?? {
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432', 10),
            database: process.env.DB_NAME ?? 'omnishield_db',
            user: process.env.DB_USER ?? 'omnishield',
            password: process.env.DB_PASSWORD ?? '',
        },
        migrations: { directory: './migrations', extension: 'ts' },
        seeds: { directory: './seeds', extension: 'ts' },
    },
    production: {
        client: 'pg',
        connection: { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } },
        migrations: { directory: './migrations' },
        pool: { min: 2, max: 20 },
    },
};
module.exports = config;
//# sourceMappingURL=knexfile.js.map