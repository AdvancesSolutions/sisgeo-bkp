import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { User } from '../entities/user.entity';

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'sigeo',
  entities: [User],
  synchronize: false,
  ssl: process.env.DB_HOST?.includes('rds.amazonaws.com') 
    ? { 
        rejectUnauthorized: false
      }
    : false,
});

async function seed() {
  await ds.initialize();
  const repo = ds.getRepository(User);
  
  const seedUsers = [
    { email: 'admin@empresa.com', name: 'Admin Super', password: 'admin123', role: 'Super Admin', id: '0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b' },
    { email: 'joao.ti@empresa.com', name: 'João Silva', password: 'gestor123', role: 'Gestor', id: '6a411dd7-e16e-4a0e-844e-151e30992385' },
    { email: 'maria.vendas@empresa.com', name: 'Maria Santos', password: 'gestor123', role: 'Gestor', id: 'b681c766-abaf-439f-8fb4-3c515decf6dd' },
    { email: 'carlos.funcionario@empresa.com', name: 'Carlos Funcionário', password: 'senha123', role: 'Funcionário', id: '24aabcd2-bbe6-4501-8a61-b7113c9c83ae' },
  ];

  for (const userData of seedUsers) {
    let user = await repo.findOne({ where: { email: userData.email } });
    if (!user) {
      const hash = await bcrypt.hash(userData.password, 10);
      user = repo.create({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        passwordHash: hash,
      });
      await repo.save(user);
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    } else {
      console.log(`⏭️ Skipped user: ${userData.email} (already exists)`);
    }
  }

  const count = await repo.count();
  console.log(`\n📊 Total users in database: ${count}`);
  console.log('✅ Seed completed!');
  
  await ds.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
