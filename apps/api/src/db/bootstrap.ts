/**
 * Bootstrap RDS: sync schema (all entities) + seed admin user.
 * Run with DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in env.
 *
 * pnpm --filter @sigeo/api db:bootstrap
 */
import { config } from 'dotenv';
import { resolve } from 'path';

const envFile =
  process.env.NODE_ENV === 'production'
    ? resolve(process.cwd(), '.env.production')
    : resolve(process.cwd(), '.env');
config({ path: envFile });

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import {
  User,
  Employee,
  Location,
  Area,
  Task,
  TaskPhoto,
  Ativo,
  Material,
  MaterialComment,
  TimeClock,
  AuditLog,
  AuditTrail,
  Organization,
  Region,
  Incident,
  SlaAlert,
  ChecklistItem,
  TaskChecklistResponse,
  OcorrenciaEmergencial,
  ScoreDiario,
  TrocaTurno,
  TrocaTurnoFoto,
  Procedimento,
  Fornecedor,
  Insumo,
} from '../entities';
import { CleaningType } from '../entities/cleaning-type.entity';

const entities = [
  User,
  Employee,
  Location,
  Area,
  Task,
  TaskPhoto,
  Ativo,
  Material,
  MaterialComment,
  TimeClock,
  AuditLog,
  AuditTrail,
  Organization,
  Region,
  Incident,
  SlaAlert,
  ChecklistItem,
  TaskChecklistResponse,
  OcorrenciaEmergencial,
  ScoreDiario,
  TrocaTurno,
  TrocaTurnoFoto,
  CleaningType,
  Procedimento,
  Fornecedor,
  Insumo,
];

const host = process.env.DB_HOST ?? 'localhost';
const isRds = host !== 'localhost' && !host.startsWith('127.');

// Em produção o schema vem das migrações SQL; não usar synchronize para não alterar tabelas com dados.
const ds = new DataSource({
  type: 'postgres',
  host,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'sigeo',
  entities,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: !!process.env.DB_LOGGING,
  ...(isRds && { ssl: { rejectUnauthorized: false } }),
});

async function bootstrap() {
  await ds.initialize();
  console.log('Schema synchronized.');

  const locationRepo = ds.getRepository(Location);
  const areaRepo = ds.getRepository(Area);
  const locationCount = await locationRepo.count();
  let defaultLocId: string;
  if (locationCount === 0) {
    const loc = locationRepo.create({
      id: uuid(),
      name: 'Unidade Principal',
      address: 'Endereço principal',
    });
    await locationRepo.save(loc);
    defaultLocId = loc.id;
    console.log('Local padrão criado:', loc.id);
  } else {
    defaultLocId = (await locationRepo.findOne({ where: {} }))!.id;
  }
  const areaCount = await areaRepo.count();
  if (areaCount === 0) {
    const area = areaRepo.create({
      id: uuid(),
      locationId: defaultLocId,
      name: 'Área padrão',
    });
    await areaRepo.save(area);
    console.log('Área padrão criada:', area.id);
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

bootstrap().catch((e: unknown) => {
  const err = e instanceof Error ? e : new Error(String(e));
  console.error('[bootstrap] Erro:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
