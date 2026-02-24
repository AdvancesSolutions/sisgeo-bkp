import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

async function generateHashes() {
  const users = [
    { email: 'admin@empresa.com', password: 'admin123', name: 'Admin Super', role: 'Super Admin' },
    { email: 'joao.ti@empresa.com', password: 'gestor123', name: 'João Silva', role: 'Gestor' },
    { email: 'maria.vendas@empresa.com', password: 'gestor123', name: 'Maria Santos', role: 'Gestor' },
    { email: 'carlos.funcionario@empresa.com', password: 'senha123', name: 'Carlos Funcionário', role: 'Funcionário' },
  ];

  console.log('INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at) VALUES\n');

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    const id = randomUUID();
    const now = new Date().toISOString();
    
    console.log(`('${id}', '${user.name}', '${user.email}', '${user.role}', '${hash}', '${now}', '${now}'),`);
  }
}

generateHashes().catch(console.error);
