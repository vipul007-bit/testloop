// ============================================================
// src/db/knex.ts — Knex.js PostgreSQL connection
// ============================================================

import Knex from 'knex'

const knex = Knex({
  client: 'pg',
  connection: process.env.DATABASE_URL ?? {
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     parseInt(process.env.DB_PORT ?? '5432', 10),
    database: process.env.DB_NAME     ?? 'omnishield_db',
    user:     process.env.DB_USER     ?? 'omnishield',
    password: process.env.DB_PASSWORD ?? '',
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30_000,
    idleTimeoutMillis:    600_000,
  },
  searchPath: ['public'],
  asyncStackTraces: process.env.NODE_ENV !== 'production',
})

export default knex
