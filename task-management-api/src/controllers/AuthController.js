import bcrypt from 'bcryptjs';
import { Usuario } from '../models/Usuario.js';
import { gerarToken } from '../middleware/auth.js';
import { ApiError } from '../middleware/erros.js';

export const login = async (req, res, next) => {
  try {
    // Aceita tanto "password" quanto "senha" para compatibilidade
    const { email, password, senha } = req.body;
    const senhaFinal = password || senha;

    if (!email || !senhaFinal) {
      throw new ApiError('Email e senha são obrigatórios', 400);
    }

    const usuario = await Usuario.obterPorEmail(email);

    if (!usuario || !usuario.ativo) {
      throw new ApiError('Usuário não encontrado ou inativo', 404);
    }

    const senhaValida = await bcrypt.compare(senhaFinal, usuario.senha);

    if (!senhaValida) {
      throw new ApiError('Senha incorreta', 401);
    }

    const token = gerarToken(usuario);

    // Retorna no contrato esperado pelo frontend SIGEO
    return res.status(200).json({
      accessToken: token,
      refreshToken: token, // Token único (pode melhorar depois)
      user: {
        id: usuario.id,
        name: usuario.nome, // Frontend espera "name", não "nome"
        nome: usuario.nome, // Mantém para compatibilidade
        email: usuario.email,
        role: usuario.role,
        setor_id: usuario.setor_id
      }
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const usuario = await Usuario.obterPorId(req.user.id);

    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    return res.status(200).json({
      data: {
        id: usuario.id,
        name: usuario.nome,
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

export const perfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.obterPorId(req.user.id);

    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
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
