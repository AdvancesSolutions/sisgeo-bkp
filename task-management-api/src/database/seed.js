import { database } from './connection.js';
import bcrypt from 'bcryptjs';
import { UUID } from '../config/uuid.js';

async function seed() {
  await database.init();

  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Limpar dados existentes
    await database.run('DELETE FROM tarefas');
    await database.run('DELETE FROM usuarios');
    await database.run('DELETE FROM setores');

    // Criar Super Admin
    const superAdminId = UUID.v4();
    const senhaHash = await bcrypt.hash('admin123', 10);
    await database.run(
      `INSERT INTO usuarios (id, nome, email, senha, role, is_superadmin, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [superAdminId, 'Super Admin', 'admin@empresa.com', senhaHash, 'SUPER_ADMIN', 1, 1]
    );
    console.log('✅ Super Admin criado: admin@empresa.com / admin123');

    // Criar Setores
    const setorTiId = UUID.v4();
    const setorVendasId = UUID.v4();
    const setorRhId = UUID.v4();

    await database.run(
      `INSERT INTO setores (id, nome, descricao, ativo) VALUES (?, ?, ?, ?)`,
      [setorTiId, 'TI', 'Setor de Tecnologia da Informação', 1]
    );
    console.log('✅ Setor TI criado');

    await database.run(
      `INSERT INTO setores (id, nome, descricao, ativo) VALUES (?, ?, ?, ?)`,
      [setorVendasId, 'Vendas', 'Setor de Vendas', 1]
    );
    console.log('✅ Setor Vendas criado');

    await database.run(
      `INSERT INTO setores (id, nome, descricao, ativo) VALUES (?, ?, ?, ?)`,
      [setorRhId, 'RH', 'Setor de Recursos Humanos', 1]
    );
    console.log('✅ Setor RH criado');

    // Criar Gestores
    const gestorTiId = UUID.v4();
    const gestorVendasId = UUID.v4();
    const gestorRhId = UUID.v4();

    const senhaGestorHash = await bcrypt.hash('gestor123', 10);

    await database.run(
      `INSERT INTO usuarios (id, nome, email, senha, role, setor_id, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [gestorTiId, 'João Gestor TI', 'joao.ti@empresa.com', senhaGestorHash, 'GESTOR', setorTiId, 1]
    );
    console.log('✅ Gestor TI criado: joao.ti@empresa.com / gestor123');

    await database.run(
      `INSERT INTO usuarios (id, nome, email, senha, role, setor_id, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [gestorVendasId, 'Maria Gestora Vendas', 'maria.vendas@empresa.com', senhaGestorHash, 'GESTOR', setorVendasId, 1]
    );
    console.log('✅ Gestora Vendas criada: maria.vendas@empresa.com / gestor123');

    await database.run(
      `INSERT INTO usuarios (id, nome, email, senha, role, setor_id, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [gestorRhId, 'Pedro Gestor RH', 'pedro.rh@empresa.com', senhaGestorHash, 'GESTOR', setorRhId, 1]
    );
    console.log('✅ Gestor RH criado: pedro.rh@empresa.com / gestor123');

    // Criar Funcionários
    const funcTi1Id = UUID.v4();
    const funcTi2Id = UUID.v4();
    const funcVendas1Id = UUID.v4();
    const funcRh1Id = UUID.v4();

    const senhaFuncHash = await bcrypt.hash('func123', 10);

    await database.run(
      `INSERT INTO usuarios (id, nome, email, senha, role, setor_id, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [funcTi1Id, 'Carlos Dev Senior', 'carlos.dev@empresa.com', senhaFuncHash, 'FUNCIONARIO', setorTiId, 1]
    );

    await database.run(
      `INSERT INTO usuarios (id, nome, email, senha, role, setor_id, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [funcTi2Id, 'Ana Dev Junior', 'ana.dev@empresa.com', senhaFuncHash, 'FUNCIONARIO', setorTiId, 1]
    );
    console.log('✅ Funcionários TI criados');

    await database.run(
      `INSERT INTO usuarios (id, nome, email, senha, role, setor_id, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [funcVendas1Id, 'Bruno Vendedor', 'bruno.vendas@empresa.com', senhaFuncHash, 'FUNCIONARIO', setorVendasId, 1]
    );
    console.log('✅ Funcionário Vendas criado');

    await database.run(
      `INSERT INTO usuarios (id, nome, email, senha, role, setor_id, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [funcRh1Id, 'Laura RH', 'laura.rh@empresa.com', senhaFuncHash, 'FUNCIONARIO', setorRhId, 1]
    );
    console.log('✅ Funcionária RH criada');

    // Criar Tarefas
    const tarefa1Id = UUID.v4();
    await database.run(
      `INSERT INTO tarefas 
       (id, titulo, descricao, status, prioridade, criador_id, gestor_id, setor_id, funcionario_id, data_vencimento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tarefa1Id,
        'Configurar novo servidor',
        'Configurar servidor de produção com Docker e Kubernetes',
        'PENDENTE',
        'ALTA',
        gestorTiId,
        gestorTiId,
        setorTiId,
        funcTi1Id,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      ]
    );

    const tarefa2Id = UUID.v4();
    await database.run(
      `INSERT INTO tarefas 
       (id, titulo, descricao, status, prioridade, criador_id, gestor_id, setor_id, funcionario_id, data_vencimento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tarefa2Id,
        'Implementar API REST',
        'Desenvolver API REST para integração com sistema de vendas',
        'EM_ANDAMENTO',
        'ALTA',
        gestorTiId,
        gestorTiId,
        setorTiId,
        funcTi2Id,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      ]
    );

    const tarefa3Id = UUID.v4();
    await database.run(
      `INSERT INTO tarefas 
       (id, titulo, descricao, status, prioridade, criador_id, gestor_id, setor_id, funcionario_id, data_vencimento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tarefa3Id,
        'Prospecção de novos clientes',
        'Fazer 50 ligações para prospecção de novos clientes em SP',
        'PENDENTE',
        'MEDIA',
        gestorVendasId,
        gestorVendasId,
        setorVendasId,
        funcVendas1Id,
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      ]
    );

    const tarefa4Id = UUID.v4();
    await database.run(
      `INSERT INTO tarefas 
       (id, titulo, descricao, status, prioridade, criador_id, gestor_id, setor_id, funcionario_id, data_vencimento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tarefa4Id,
        'Processar folha de pagamento',
        'Processar folha de pagamento de fevereiro para todos os funcionários',
        'EM_ANDAMENTO',
        'ALTA',
        gestorRhId,
        gestorRhId,
        setorRhId,
        funcRh1Id,
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      ]
    );

    console.log('✅ Tarefas criadas');
    console.log('');
    console.log('🎉 Seed concluído com sucesso!');
    console.log('');
    console.log('📝 Credenciais para teste:');
    console.log('  Super Admin: admin@empresa.com / admin123');
    console.log('  Gestor TI: joao.ti@empresa.com / gestor123');
    console.log('  Gestora Vendas: maria.vendas@empresa.com / gestor123');
    console.log('  Gestor RH: pedro.rh@empresa.com / gestor123');
    console.log('  Funcionários: func123 (consulte README.md para emails)');

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

seed();
