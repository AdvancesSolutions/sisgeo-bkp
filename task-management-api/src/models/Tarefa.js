import { database } from '../database/connection.js';
import { UUID } from '../config/uuid.js';

export class Tarefa {
  static async criar(dados) {
    const id = UUID.v4();
    const agora = new Date().toISOString();

    await database.run(
      `INSERT INTO tarefas 
       (id, titulo, descricao, status, prioridade, criador_id, gestor_id, setor_id, funcionario_id, data_vencimento, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dados.titulo,
        dados.descricao || null,
        'PENDENTE',
        dados.prioridade || 'MEDIA',
        dados.criador_id,
        dados.gestor_id,
        dados.setor_id,
        dados.funcionario_id || null,
        dados.data_vencimento || null,
        agora,
        agora
      ]
    );

    return this.obterPorId(id);
  }

  static async obterPorId(id) {
    return database.get(
      `SELECT id, titulo, descricao, status, prioridade, criador_id, gestor_id, setor_id, funcionario_id, data_vencimento, criado_em, atualizado_em
       FROM tarefas WHERE id = ?`,
      [id]
    );
  }

  static async listar(filtros = {}) {
    let query = `SELECT id, titulo, descricao, status, prioridade, criador_id, gestor_id, setor_id, funcionario_id, data_vencimento, criado_em, atualizado_em
                 FROM tarefas WHERE 1=1`;
    const params = [];

    if (filtros.setor_id) {
      query += ' AND setor_id = ?';
      params.push(filtros.setor_id);
    }

    if (filtros.funcionario_id) {
      query += ' AND funcionario_id = ?';
      params.push(filtros.funcionario_id);
    }

    if (filtros.gestor_id) {
      query += ' AND gestor_id = ?';
      params.push(filtros.gestor_id);
    }

    if (filtros.status) {
      query += ' AND status = ?';
      params.push(filtros.status);
    }

    if (filtros.prioridade) {
      query += ' AND prioridade = ?';
      params.push(filtros.prioridade);
    }

    query += ' ORDER BY data_vencimento ASC, criado_em DESC';

    return database.all(query, params);
  }

  static async atualizar(id, dados) {
    const agora = new Date().toISOString();
    const atualizacoes = [];
    const valores = [];

    if (dados.titulo !== undefined) {
      atualizacoes.push('titulo = ?');
      valores.push(dados.titulo);
    }

    if (dados.descricao !== undefined) {
      atualizacoes.push('descricao = ?');
      valores.push(dados.descricao || null);
    }

    if (dados.status !== undefined) {
      atualizacoes.push('status = ?');
      valores.push(dados.status);
    }

    if (dados.prioridade !== undefined) {
      atualizacoes.push('prioridade = ?');
      valores.push(dados.prioridade);
    }

    if (dados.funcionario_id !== undefined) {
      atualizacoes.push('funcionario_id = ?');
      valores.push(dados.funcionario_id || null);
    }

    if (dados.data_vencimento !== undefined) {
      atualizacoes.push('data_vencimento = ?');
      valores.push(dados.data_vencimento || null);
    }

    if (atualizacoes.length === 0) return this.obterPorId(id);

    atualizacoes.push('atualizado_em = ?');
    valores.push(agora);
    valores.push(id);

    const query = `UPDATE tarefas SET ${atualizacoes.join(', ')} WHERE id = ?`;
    await database.run(query, valores);

    return this.obterPorId(id);
  }

  static async deletar(id) {
    await database.run('DELETE FROM tarefas WHERE id = ?', [id]);
  }

  static async obterEstatisticas(setorId) {
    const [
      totalTarefas,
      pendentes,
      emAndamento,
      concluidas,
      canceladas
    ] = await Promise.all([
      database.get('SELECT COUNT(*) as total FROM tarefas WHERE setor_id = ?', [setorId]),
      database.get('SELECT COUNT(*) as total FROM tarefas WHERE setor_id = ? AND status = ?', [setorId, 'PENDENTE']),
      database.get('SELECT COUNT(*) as total FROM tarefas WHERE setor_id = ? AND status = ?', [setorId, 'EM_ANDAMENTO']),
      database.get('SELECT COUNT(*) as total FROM tarefas WHERE setor_id = ? AND status = ?', [setorId, 'CONCLUIDA']),
      database.get('SELECT COUNT(*) as total FROM tarefas WHERE setor_id = ? AND status = ?', [setorId, 'CANCELADA'])
    ]);

    return {
      total: totalTarefas.total,
      pendentes: pendentes.total,
      emAndamento: emAndamento.total,
      concluidas: concluidas.total,
      canceladas: canceladas.total
    };
  }
}
