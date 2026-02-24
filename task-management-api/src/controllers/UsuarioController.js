import bcrypt from 'bcryptjs';
import { Usuario } from '../models/Usuario.js';
import { ApiError } from '../middleware/erros.js';

export const criarUsuario = async (req, res, next) => {
  try {
    const { nome, email, senha, role, setor_id } = req.body;

    // Validações básicas
    if (!nome || !email || !senha || !role) {
      throw new ApiError('Nome, email, senha e role são obrigatórios', 400);
    }

    if (!['SUPER_ADMIN', 'GESTOR', 'FUNCIONARIO'].includes(role)) {
      throw new ApiError('Role inválido', 400);
    }

    // Validação de permissões
    // SUPER_ADMIN pode criar qualquer tipo de usuário
    // GESTOR pode criar apenas FUNCIONARIO
    // FUNCIONARIO não pode criar ninguém
    if (!req.user.is_superadmin) {
      if (req.user.role === 'GESTOR') {
        // Gestor só pode criar Funcionários
        if (role !== 'FUNCIONARIO') {
          throw new ApiError('Gestores só podem criar Funcionários', 403);
        }
        // Funcionário deve estar no mesmo setor do Gestor
        if (setor_id && setor_id !== req.user.setor_id) {
          throw new ApiError('Gestor só pode criar usuários em seu próprio setor', 403);
        }
      } else {
        // Funcionários não podem criar usuários
        throw new ApiError('Seu role não permite criar usuários', 403);
      }
    }

    // Se for Gestor criando Funcionário, usar o setor do Gestor
    const setorFinal = req.user.role === 'GESTOR' ? req.user.setor_id : setor_id;

    // Verificar se email já existe
    const usuarioExistente = await Usuario.obterPorEmail(email);
    if (usuarioExistente) {
      throw new ApiError('Email já cadastrado', 409);
    }

    // Gestor e Funcionário precisam de um setor
    if (role !== 'SUPER_ADMIN' && !setor_id) {
      throw new ApiError('Setor é obrigatório para Gestores e Funcionários', 400);
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await Usuario.criar({
      nome,
      email,
      senha: senhaHash,
      role,
      setor_id: role === 'SUPER_ADMIN' ? null : setorFinal,
      is_superadmin: role === 'SUPER_ADMIN'
    });

    return res.status(201).json({
      mensagem: 'Usuário criado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        setor_id: usuario.setor_id
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listarUsuarios = async (req, res, next) => {
  try {
    const { setor_id, role } = req.query;

    // Super Admin vê todos os usuários
    // Gestor vê apenas usuários do seu setor
    const filtros = {};

    if (!req.user.is_superadmin && req.user.role === 'GESTOR') {
      filtros.setor_id = req.user.setor_id;
    } else if (setor_id) {
      filtros.setor_id = setor_id;
    }

    if (role) {
      filtros.role = role;
    }

    const usuarios = await Usuario.listar(filtros);

    return res.status(200).json({
      data: usuarios.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        role: u.role,
        setor_id: u.setor_id,
        ativo: u.ativo
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const obterUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.obterPorId(id);

    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    // Verificar permissão: gestor só vê usuários do seu setor
    if (!req.user.is_superadmin && req.user.role === 'GESTOR' && usuario.setor_id !== req.user.setor_id) {
      throw new ApiError('Acesso negado', 403);
    }

    return res.status(200).json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        setor_id: usuario.setor_id,
        ativo: usuario.ativo
      }
    });
  } catch (error) {
    next(error);
  }
};

export const atualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, email, role, setor_id, ativo } = req.body;

    const usuario = await Usuario.obterPorId(id);

    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    // Verificar permissão
    if (!req.user.is_superadmin && req.user.role === 'GESTOR' && usuario.setor_id !== req.user.setor_id) {
      throw new ApiError('Acesso negado', 403);
    }

    // Se está tentando mudar o role, precisa ser super admin
    if (role && role !== usuario.role && !req.user.is_superadmin) {
      throw new ApiError('Apenas Super Admin pode alterar roles', 403);
    }

    const usuarioAtualizado = await Usuario.atualizar(id, {
      nome,
      email,
      role,
      setor_id,
      ativo
    });

    return res.status(200).json({
      mensagem: 'Usuário atualizado com sucesso',
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        role: usuarioAtualizado.role,
        setor_id: usuarioAtualizado.setor_id
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deletarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.obterPorId(id);

    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    // Apenas Super Admin pode deletar
    if (!req.user.is_superadmin) {
      throw new ApiError('Apenas Super Admin pode deletar usuários', 403);
    }

    await Usuario.deletar(id);

    return res.status(200).json({
      mensagem: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
export const alterarSenha = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { senhaAtual, senhaNova } = req.body;

    if (!senhaNova) {
      throw new ApiError('Nova senha é obrigatória', 400);
    }

    if (senhaNova.length < 6) {
      throw new ApiError('Nova senha deve ter pelo menos 6 caracteres', 400);
    }

    // Super Admin não precisa fornecer senha atual
    // Outros usuários precisam
    if (!req.user.is_superadmin && !senhaAtual) {
      throw new ApiError('Senha atual é obrigatória', 400);
    }

    const usuario = await Usuario.obterPorId(id);

    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    // Verificar permissão: usuário só pode alterar sua própria senha, ou super admin altera qualquer uma
    if (!req.user.is_superadmin && req.user.id !== id) {
      throw new ApiError('Você só pode alterar sua própria senha', 403);
    }

    // Se não for super admin, verificar senha atual
    if (!req.user.is_superadmin) {
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        throw new ApiError('Senha atual incorreta', 401);
      }
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(senhaNova, 10);

    await Usuario.atualizar(id, { senha: senhaHash });

    return res.status(200).json({
      mensagem: 'Senha alterada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};