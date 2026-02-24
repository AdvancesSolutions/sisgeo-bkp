// NestJS CLI seed command

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

async function seed() {
  const app = await NestFactory.create(AppModule);

  const userRepository: Repository<User> = app.get(getRepositoryToken(User));

  const users = [
    {
      id: '0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b',
      name: 'Admin Super',
      email: 'admin@empresa.com',
      password: 'admin123',
      role: 'Super Admin',
    },
    {
      id: '6a411dd7-e16e-4a0e-844e-151e30992385',
      name: 'João Silva',
      email: 'joao.ti@empresa.com',
      password: 'gestor123',
      role: 'Gestor',
    },
    {
      id: 'b681c766-abaf-439f-8fb4-3c515decf6dd',
      name: 'Maria Santos',
      email: 'maria.vendas@empresa.com',
      password: 'gestor123',
      role: 'Gestor',
    },
    {
      id: '24aabcd2-bbe6-4501-8a61-b7113c9c83ae',
      name: 'Carlos Funcionário',
      email: 'carlos.funcionario@empresa.com',
      password: 'senha123',
      role: 'Funcionário',
    },
  ];

  console.log('Seeding database...');

  for (const userData of users) {
    const exists = await userRepository.findOne({ where: { email: userData.email } });

    if (!exists) {
      const hash = await bcrypt.hash(userData.password, 10);
      const user = userRepository.create({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        passwordHash: hash,
      });
      await userRepository.save(user);
      console.log(`✅ Created user: ${userData.email}`);
    } else {
      console.log(`⏭️ Skipped user: ${userData.email} (already exists)`);
    }
  }

  const count = await userRepository.count();
  console.log(`\n📊 Total users: ${count}`);
  console.log('✅ Seed completed!');

  await app.close();
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
