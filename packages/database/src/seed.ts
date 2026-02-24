/**
 * Seed: perfis de acesso e 3 setores de exemplo
 * Execução: pnpm --filter @sigeo/database seed
 */

import { PrismaClient, PerfilAcesso, ClassificacaoRisco } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Perfis de acesso (Users)
  const adminHash = await bcrypt.hash('admin123', 10);
  const supervisorHash = await bcrypt.hash('super123', 10);
  const auxiliarHash = await bcrypt.hash('aux123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sigeo.local' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@sigeo.local',
      senhaHash: adminHash,
      perfil: PerfilAcesso.ADMIN,
      ativo: true,
    },
  });
  console.log('✓ Admin:', admin.email);

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@sigeo.local' },
    update: {},
    create: {
      nome: 'Supervisor Exemplo',
      email: 'supervisor@sigeo.local',
      senhaHash: supervisorHash,
      perfil: PerfilAcesso.SUPERVISOR,
      ativo: true,
    },
  });
  console.log('✓ Supervisor:', supervisor.email);

  const auxiliar = await prisma.user.upsert({
    where: { email: 'auxiliar@sigeo.local' },
    update: {},
    create: {
      nome: 'Auxiliar Exemplo',
      email: 'auxiliar@sigeo.local',
      senhaHash: auxiliarHash,
      perfil: PerfilAcesso.AUXILIAR,
      ativo: true,
    },
  });
  console.log('✓ Auxiliar:', auxiliar.email);

  // 2. Setores de exemplo (3 setores)
  const setoresData = [
    {
      nome: 'Área de Produção',
      classificacaoRisco: ClassificacaoRisco.CRITICO,
      frequenciaLimpeza: 'DIARIA',
      lat: -23.5505,
      long: -46.6333,
      raioGeofencing: 0.05,
      qrCodeId: 'QR-PROD-001',
    },
    {
      nome: 'Almoxarifado',
      classificacaoRisco: ClassificacaoRisco.SEMICRITICO,
      frequenciaLimpeza: 'SEMANAL',
      lat: -23.5506,
      long: -46.6334,
      raioGeofencing: 0.03,
      qrCodeId: 'QR-ALM-001',
    },
    {
      nome: 'Recepção e Área Administrativa',
      classificacaoRisco: ClassificacaoRisco.NAO_CRITICO,
      frequenciaLimpeza: 'DIARIA',
      lat: -23.5504,
      long: -46.6332,
      raioGeofencing: 0.1,
      qrCodeId: 'QR-REC-001',
    },
  ];

  for (const s of setoresData) {
    const existing = await prisma.setor.findFirst({ where: { qrCodeId: s.qrCodeId } });
    if (!existing) {
      await prisma.setor.create({ data: s });
      console.log('✓ Setor criado:', s.nome);
    } else {
      console.log('✓ Setor já existe:', s.nome);
    }
  }

  console.log('✅ Seed concluído.');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
