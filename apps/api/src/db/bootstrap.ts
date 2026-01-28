/**
 * Bootstrap RDS: sync schema (all entities) + seed admin user.
 * Run with DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in env.
 *
 * pnpm --filter @sigeo/api db:bootstrap
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import {
  User,
  Employee,
  Location,
  Area,
  Task,
  Material,
  TimeClock,
  AuditLog,
} from '../entities';

const entities = [
  User,
  Employee,
  Location,
  Area,
  Task,
  Material,
  TimeClock,
  AuditLog,
];

const host = process.env.DB_HOST ?? 'localhost';
const isRds = host !== 'localhost' && !host.startsWith('127.');

const ds = new DataSource({
  type: 'postgres',
  host,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'sigeo',
  entities,
  synchronize: true,
  logging: !!process.env.DB_LOGGING,
  ...(isRds && { ssl: { rejectUnauthorized: false } }),
});

async function bootstrap() {
  await ds.initialize();
  console.log('Schema synchronized.');

  const locationRepo = ds.getRepository(Location);
  const locationCount = await locationRepo.count();
  if (locationCount === 0) {
    const loc = locationRepo.create({
      id: uuid(),
      name: 'Unidade Principal',
      address: 'Endereço principal',
    });
    await locationRepo.save(loc);
    console.log('Local padrão criado:', loc.id);
  }

  const repo = ds.getRepository(User);
  const email = 'admin@sigeo.local';
  let u = await repo.findOne({ where: { email } });
  if (u) {
    console.log('Admin user already exists.');
    await ds.destroy();
    return;
  }
  const hash = await bcrypt.hash('admin123', 10);
  u = repo.create({
    id: uuid(),
    name: 'Admin',
    email,
    role: 'ADMIN',
    passwordHash: hash,
  });
  await repo.save(u);
  console.log('Admin user created: admin@sigeo.local / admin123');
  await ds.destroy();
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
