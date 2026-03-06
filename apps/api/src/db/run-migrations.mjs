#!/usr/bin/env node
/**
 * Executa migrações SQL na inicialização do container.
 * Usa DB_HOST, DB_USER, DB_PASSWORD, DB_NAME do ambiente.
 */
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const host = process.env.DB_HOST ?? 'localhost';
const port = parseInt(process.env.DB_PORT ?? '5432', 10);
const user = process.env.DB_USER ?? 'postgres';
const password = process.env.DB_PASSWORD ?? 'postgres';
const database = process.env.DB_NAME ?? 'sigeo';
const isRds = host !== 'localhost' && !host.startsWith('127.');

const client = new pg.Client({
  host,
  port,
  user,
  password,
  database,
  ssl: isRds ? { rejectUnauthorized: false } : false,
});

const MIGRATIONS_DIR = resolve(__dirname, 'migrations');

async function run() {
  try {
    await client.connect();
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8');
      await client.query(sql);
      console.log('[migrate]', file);
    }
    console.log('[migrate] OK');
  } catch (e) {
    console.error('[migrate]', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
