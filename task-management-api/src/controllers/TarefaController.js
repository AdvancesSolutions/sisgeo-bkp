import { Tarefa } from '../models/Tarefa.js';
import { Usuario } from '../models/Usuario.js';
import { ApiError } from '../middleware/erros.js';

export const criarTarefa = async (req, res, next) => {
  try {
    const { titulo, descricao, prioridade, funcionario_id, data_vencimento } = req.body;

    if (!titulo) {
      throw new ApiError('Título da tarefa é obrigatório', 400);
    }

    if (!funcionario_id) {
      throw new ApiError('Funcionário é obrigatório', 400);
    }

    // Verificar se gestor está tentando criar tarefa em outro setor
    if (req.user.role === 'GESTOR') {
      const funcionario = await Usuario.obterPorId(funcionario_id);
      if (!funcionario || funcionario.setor_id !== req.user.setor_id) {
        throw new ApiError('Funcionário não pertence ao seu setor', 403);
      }
    }

    const tarefa = await Tarefa.criar({
      titulo,
      descricao,
      prioridade,
      criador_id: req.user.id,
      gestor_id: req.user.id,
      setor_id: req.user.setor_id,
      funcionario_id,
      data_vencimento
    });

    return res.status(201).json({
      mensagem: 'Tarefa criada com sucesso',
      tarefa
    });
  } catch (error) {
    next(error);
  }
};

export const listarTarefas = async (req, res, next) => {
  try {
    const { status, prioridade } = req.query;
    const filtros = {};

    // Determinar escopo de visualização
    if (req.user.is_superadmin) {
      // Super Admin vê todas as tarefas
    } else if (req.user.role === 'GESTOR') {
      // Gestor vê tarefas do seu setor
      filtros.setor_id = req.user.setor_id;
    } else if (req.user.role === 'FUNCIONARIO') {
      // Funcionário vê apenas suas tarefas
      filtros.funcionario_id = req.user.id;
    }

    if (status) {
      filtros.status = status;
    }

    if (prioridade) {
      filtros.prioridade = prioridade;
    }

    const tarefas = await Tarefa.listar(filtros);

    return res.status(200).json({
      tarefas
    });
  } catch (error) {
    next(error);
  }
};

export const obterTarefa = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tarefa = await Tarefa.obterPorId(id);

    if (!tarefa) {
      throw new ApiError('Tarefa não encontrada', 404);
    }

    // Verificar permissão
    if (!req.user.is_superadmin) {
      if (req.user.role === 'GESTOR' && tarefa.setor_id !== req.user.setor_id) {
        throw new ApiError('Acesso negado', 403);
      }

      if (req.user.role === 'FUNCIONARIO' && tarefa.funcionario_id !== req.user.id) {
        throw new ApiError('Acesso negado', 403);
      }
    }

    return res.status(200).json({
      tarefa
    });
  } catch (error) {
    next(error);
  }
};

export const atualizarTarefa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, status, prioridade, funcionario_id, data_vencimento } = req.body;

    const tarefa = await Tarefa.obterPorId(id);

    if (!tarefa) {
      throw new ApiError('Tarefa não encontrada', 404);
    }

    // Verificar permissão
    if (!req.user.is_superadmin) {
      if (req.user.role === 'GESTOR' && tarefa.setor_id !== req.user.setor_id) {
        throw new ApiError('Acesso negado', 403);
      }

      // Funcionário só pode atualizar status
      if (req.user.role === 'FUNCIONARIO') {
        if (tarefa.funcionario_id !== req.user.id) {
          throw new ApiError('Acesso negado', 403);
        }
        if (!status) {
          throw new ApiError('Funcionário só pode atualizar o status', 400);
        }
      }
    }

    // Se valor do funcionário está mudando, validar setor
    if (funcionario_id && funcionario_id !== tarefa.funcionario_id) {
      const novoFuncionario = await Usuario.obterPorId(funcionario_id);
      if (!novoFuncionario || novoFuncionario.setor_id !== tarefa.setor_id) {
        throw new ApiError('Funcionário não pertence ao setor da tarefa', 403);
      }
    }

    const tarefaAtualizada = await Tarefa.atualizar(id, {
      titulo,
      descricao,
      status,
      prioridade,
      funcionario_id,
      data_vencimento
    });

    return res.status(200).json({
      mensagem: 'Tarefa atualizada com sucesso',
      tarefa: tarefaAtualizada
    });
  } catch (error) {
    next(error);
  }
};

export const deletarTarefa = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tarefa = await Tarefa.obterPorId(id);

    if (!tarefa) {
      throw new ApiError('Tarefa não encontrada', 404);
    }

    // Apenas gestor/criador ou super admin pode deletar
    if (!req.user.is_superadmin && tarefa.gestor_id !== req.user.id) {
      throw new ApiError('Acesso negado', 403);
    }

    await Tarefa.deletar(id);

    return res.status(200).json({
      mensagem: 'Tarefa deletada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

export const obterEstatisticas = async (req, res, next) => {
  try {
    let setorId;

    if (req.user.is_superadmin) {
      return res.status(200).json({
        mensagem: 'Super Admin não tem estatísticas de setor específico'
      });
    } else if (req.user.role === 'GESTOR') {
      setorId = req.user.setor_id;
    } else {
      throw new ApiError('Apenas Gestores podem consultar estatísticas', 403);
    }

    const estatisticas = await Tarefa.obterEstatisticas(setorId);

    return res.status(200).json({
      estatisticas
    });
  } catch (error) {
    next(error);
  }
};
