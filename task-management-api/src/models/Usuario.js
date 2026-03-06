import { database } from '../database/connection.js';
import { UUID } from '../config/uuid.js';

export class Usuario {
  static async criar(dados) {
    const id = UUID.v4();
    const agora = new Date().toISOString();

    await database.run(
      `INSERT INTO usuarios (id, nome, email, senha, role, setor_id, is_superadmin, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dados.nome,
        dados.email,
        dados.senha,
        dados.role,
        dados.setor_id || null,
        dados.is_superadmin ? 1 : 0,
        1,
        agora,
        agora
      ]
    );

    return this.obterPorId(id);
  }

  static async obterPorId(id) {
    return database.get(
      `SELECT id, nome, email, role, setor_id, is_superadmin, ativo, criado_em, atualizado_em
       FROM usuarios WHERE id = ?`,
      [id]
    );
  }

  static async obterPorEmail(email) {
    return database.get(
      `SELECT id, nome, email, senha, role, setor_id, is_superadmin, ativo, criado_em, atualizado_em
       FROM usuarios WHERE email = ?`,
      [email]
    );
  }

  static async listar(filtros = {}) {
    let query = `SELECT id, nome, email, role, setor_id, is_superadmin, ativo, criado_em, atualizado_em
                 FROM usuarios WHERE 1=1`;
    const params = [];

    if (filtros.setor_id) {
      query += ' AND setor_id = ?';
      params.push(filtros.setor_id);
    }

    if (filtros.role) {
      query += ' AND role = ?';
      params.push(filtros.role);
    }

    if (filtros.ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(filtros.ativo ? 1 : 0);
    }

    query += ' ORDER BY criado_em DESC';

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

    if (dados.email !== undefined) {
      atualizacoes.push('email = ?');
      valores.push(dados.email);
    }

    if (dados.role !== undefined) {
      atualizacoes.push('role = ?');
      valores.push(dados.role);
    }

    if (dados.setor_id !== undefined) {
      atualizacoes.push('setor_id = ?');
      valores.push(dados.setor_id || null);
    }

    if (dados.ativo !== undefined) {
      atualizacoes.push('ativo = ?');
      valores.push(dados.ativo ? 1 : 0);
    }

    if (atualizacoes.length === 0) return this.obterPorId(id);

    atualizacoes.push('atualizado_em = ?');
    valores.push(agora);
    valores.push(id);

    const query = `UPDATE usuarios SET ${atualizacoes.join(', ')} WHERE id = ?`;
    await database.run(query, valores);

    return this.obterPorId(id);
  }

  static async deletar(id) {
    await database.run('DELETE FROM usuarios WHERE id = ?', [id]);
  }
}
