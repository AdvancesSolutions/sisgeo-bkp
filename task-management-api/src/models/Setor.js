import { database } from '../database/connection.js';
import { UUID } from '../config/uuid.js';

export class Setor {
  static async criar(dados) {
    const id = UUID.v4();
    const agora = new Date().toISOString();

    await database.run(
      `INSERT INTO setores (id, nome, descricao, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, dados.nome, dados.descricao || null, 1, agora, agora]
    );

    return this.obterPorId(id);
  }

  static async obterPorId(id) {
    return database.get(
      `SELECT id, nome, descricao, ativo, criado_em, atualizado_em
       FROM setores WHERE id = ?`,
      [id]
    );
  }

  static async obterPorNome(nome) {
    return database.get(
      `SELECT id, nome, descricao, ativo, criado_em, atualizado_em
       FROM setores WHERE nome = ?`,
      [nome]
    );
  }

  static async listar(filtros = {}) {
    let query = `SELECT id, nome, descricao, ativo, criado_em, atualizado_em
                 FROM setores WHERE 1=1`;
    const params = [];

    if (filtros.ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(filtros.ativo ? 1 : 0);
    }

    query += ' ORDER BY nome ASC';

    return database.all(query, params);
  }

  static async atualizar(id, dados) {
    const agora = new Date().toISOString();
    const atualizacoes = [];
    const valores = [];

    if (dados.nome !== undefined) {
      atualizacoes.push('nome = ?');
      valores.push(dados.nome);
    }

    if (dados.descricao !== undefined) {
      atualizacoes.push('descricao = ?');
      valores.push(dados.descricao || null);
    }

    if (dados.ativo !== undefined) {
      atualizacoes.push('ativo = ?');
      valores.push(dados.ativo ? 1 : 0);
    }

    if (atualizacoes.length === 0) return this.obterPorId(id);

    atualizacoes.push('atualizado_em = ?');
    valores.push(agora);
    valores.push(id);

    const query = `UPDATE setores SET ${atualizacoes.join(', ')} WHERE id = ?`;
    await database.run(query, valores);

    return this.obterPorId(id);
  }

  static async deletar(id) {
    await database.run('DELETE FROM setores WHERE id = ?', [id]);
  }

  static async obterTotalFuncionarios(setorId) {
    const result = await database.get(
      `SELECT COUNT(*) as total FROM usuarios WHERE setor_id = ? AND role = 'FUNCIONARIO'`,
      [setorId]
    );
    return result.total;
  }

  static async obterTotalTarefas(setorId) {
    const result = await database.get(
      `SELECT COUNT(*) as total FROM tarefas WHERE setor_id = ?`,
      [setorId]
    );
    return result.total;
  }
}
