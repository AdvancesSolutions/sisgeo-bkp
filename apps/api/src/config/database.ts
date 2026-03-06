import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as entities from '../entities';

const host = process.env.DB_HOST ?? 'localhost';
const isRds = host !== 'localhost' && !host.startsWith('127.');

export const getDbConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'sigeo',
  entities: Object.values(entities),
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ...(isRds && { ssl: { rejectUnauthorized: false } }),
});
