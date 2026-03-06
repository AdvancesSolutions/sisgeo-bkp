import { database } from './connection.js';

async function migrate() {
  await database.init();

  console.log('📦 Iniciando migração do banco de dados...');

  try {
    // Tabela de Setores
    await database.run(`
      CREATE TABLE IF NOT EXISTS setores (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL UNIQUE,
        descricao TEXT,
        ativo BOOLEAN DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela setores criada');

    // Tabela de Usuários
    await database.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'GESTOR', 'FUNCIONARIO')),
        setor_id TEXT,
        is_superadmin BOOLEAN DEFAULT 0,
        ativo BOOLEAN DEFAULT 1,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (setor_id) REFERENCES setores(id)
      )
    `);
    console.log('✅ Tabela usuarios criada');

    // Tabela de Tarefas
    await database.run(`
      CREATE TABLE IF NOT EXISTS tarefas (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')),
        prioridade TEXT DEFAULT 'MEDIA' CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA')),
        criador_id TEXT NOT NULL,
        gestor_id TEXT NOT NULL,
        setor_id TEXT NOT NULL,
        funcionario_id TEXT,
        data_vencimento DATETIME,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (criador_id) REFERENCES usuarios(id),
        FOREIGN KEY (gestor_id) REFERENCES usuarios(id),
        FOREIGN KEY (setor_id) REFERENCES setores(id),
        FOREIGN KEY (funcionario_id) REFERENCES usuarios(id)
      )
    `);
    console.log('✅ Tabela tarefas criada');

    // Criar índices para melhor performance
    await database.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_setor_id ON usuarios(setor_id)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_tarefas_setor_id ON tarefas(setor_id)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_tarefas_funcionario_id ON tarefas(funcionario_id)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_tarefas_gestor_id ON tarefas(gestor_id)`);

    console.log('✅ Índices criados');
    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

migrate();
