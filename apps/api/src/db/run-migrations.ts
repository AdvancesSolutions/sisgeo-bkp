#!/usr/bin/env npx ts-node
/**
 * Executa todas as migrações SQL em src/db/migrations/.
 * Usa variáveis de ambiente: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.
 *
 * Local: pnpm --filter @sigeo/api run db:migrate
 * Produção: defina as variáveis e execute.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, readdirSync } from 'fs';

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

const MIGRATIONS_DIR = resolve(__dirname, 'migrations');

async function runMigrations() {
  console.log(`Conectando a ${host}:${port}/${db}...`);
  await ds.initialize();
  const q = ds.createQueryRunner();
  try {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const filePath = resolve(MIGRATIONS_DIR, file);
      const sql = readFileSync(filePath, 'utf-8');
      await q.query(sql);
      console.log(`✓ ${file}: executado`);
    }
    console.log('Migrações concluídas com sucesso.');
  } finally {
    await q.release();
    await ds.destroy();
  }
}

runMigrations().catch((e) => {
  console.error('Erro nas migrações:', e.message);
  process.exit(1);
});
