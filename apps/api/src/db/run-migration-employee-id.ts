#!/usr/bin/env npx ts-node
/**
 * Executa a migração add-user-employee-id.
 * Usa as mesmas variáveis de ambiente da API (DB_HOST, DB_USER, etc.).
 *
 * Local: pnpm --filter @sigeo/api exec ts-node -r tsconfig-paths/register src/db/run-migration-employee-id.ts
 * Produção: defina DB_HOST, DB_USER, DB_PASSWORD, DB_NAME e execute.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Carrega .env.production se NODE_ENV=production, senão .env
const envFile =
  process.env.NODE_ENV === 'production'
    ? resolve(process.cwd(), '.env.production')
    : resolve(process.cwd(), '.env');
config({ path: envFile });

import { DataSource } from 'typeorm';

const host = process.env.DB_HOST ?? 'localhost';
const port = parseInt(process.env.DB_PORT ?? '5432', 10);
const user = process.env.DB_USER ?? 'postgres';
const password = process.env.DB_PASSWORD ?? 'postgres';
const db = process.env.DB_NAME ?? 'sigeo';
const isRds = host !== 'localhost' && !host.startsWith('127.');

const ds = new DataSource({
  type: 'postgres',
  host,
  port,
  username: user,
  password,
  database: db,
  ssl: isRds ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  console.log(`Conectando a ${host}:${port}/${db}...`);
  await ds.initialize();
  const q = ds.createQueryRunner();
  try {
    await q.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id uuid NULL;
    `);
    console.log('✓ Coluna employee_id adicionada (ou já existia).');
    await q.query(`
      CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
    `);
    console.log('✓ Índice idx_users_employee_id criado (ou já existia).');
    console.log('Migração concluída com sucesso.');
  } finally {
    await q.release();
    await ds.destroy();
  }
}

migrate().catch((e) => {
  console.error('Erro na migração:', e.message);
  process.exit(1);
});
