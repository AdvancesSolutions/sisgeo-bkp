import { Setor } from '../models/Setor.js';
import { ApiError } from '../middleware/erros.js';

export const criarSetor = async (req, res, next) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome) {
      throw new ApiError('Nome do setor é obrigatório', 400);
    }

    // Apenas SUPER_ADMIN pode criar setores
    if (!req.user?.is_superadmin) {
      throw new ApiError('Apenas Super Admins podem criar setores', 403);
    }

    // Verificar se nome já existe
    const setorExistente = await Setor.obterPorNome(nome);
    if (setorExistente) {
      throw new ApiError('Setor com este nome já existe', 409);
    }

    const setor = await Setor.criar({ nome, descricao });

    return res.status(201).json({
      mensagem: 'Setor criado com sucesso',
      setor: {
        id: setor.id,
        nome: setor.nome,
        descricao: setor.descricao,
        ativo: setor.ativo
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listarSetores = async (req, res, next) => {
  try {
    const setores = await Setor.listar({ ativo: true });

    const setoresComDetalhes = await Promise.all(
      setores.map(async (setor) => ({
        id: setor.id,
        nome: setor.nome,
        descricao: setor.descricao,
        totalFuncionarios: await Setor.obterTotalFuncionarios(setor.id),
        totalTarefas: await Setor.obterTotalTarefas(setor.id),
        criado_em: setor.criado_em
      }))
    );

    return res.status(200).json({
      data: setoresComDetalhes
    });
  } catch (error) {
    next(error);
  }
};

export const obterSetor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const setor = await Setor.obterPorId(id);

    if (!setor) {
      throw new ApiError('Setor não encontrado', 404);
    }

    const totalFuncionarios = await Setor.obterTotalFuncionarios(id);
    const totalTarefas = await Setor.obterTotalTarefas(id);

    return res.status(200).json({
      setor: {
        id: setor.id,
        nome: setor.nome,
        descricao: setor.descricao,
        ativo: setor.ativo,
        totalFuncionarios,
        totalTarefas,
        criado_em: setor.criado_em
      }
    });
  } catch (error) {
    next(error);
  }
};

export const atualizarSetor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, descricao, ativo } = req.body;

    const setor = await Setor.obterPorId(id);

    if (!setor) {
      throw new ApiError('Setor não encontrado', 404);
    }

    const setorAtualizado = await Setor.atualizar(id, { nome, descricao, ativo });

    return res.status(200).json({
      mensagem: 'Setor atualizado com sucesso',
      setor: {
        id: setorAtualizado.id,
        nome: setorAtualizado.nome,
        descricao: setorAtualizado.descricao,
        ativo: setorAtualizado.ativo
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deletarSetor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const setor = await Setor.obterPorId(id);

    if (!setor) {
      throw new ApiError('Setor não encontrado', 404);
    }

    await Setor.deletar(id);

    return res.status(200).json({
      mensagem: 'Setor deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
