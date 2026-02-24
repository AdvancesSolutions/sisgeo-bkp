import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui';

export const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};

export const superAdminOnly = (req, res, next) => {
  if (!req.user || !req.user.is_superadmin) {
    return res.status(403).json({
      erro: 'Acesso negado. Apenas Super Admin pode acessar este recurso.'
    });
  }
  next();
};

export const gestorOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'GESTOR' && !req.user.is_superadmin)) {
    return res.status(403).json({
      erro: 'Acesso negado. Apenas Gestores podem acessar este recurso.'
    });
  }
  next();
};

export const gestorOuFuncionarioOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'GESTOR' && req.user.role !== 'FUNCIONARIO' && !req.user.is_superadmin)) {
    return res.status(403).json({
      erro: 'Acesso negado. Acesso restrito.'
    });
  }
  next();
};

/**
 * Middleware para validar permissão de acesso por setor
 * Gestores só podem acessar dados do seu setor
 * Super Admin pode acessar tudo
 */
export const validarSetor = (req, res, next) => {
  // Super Admin pode acessar qualquer setor
  if (req.user.is_superadmin) {
    return next();
  }

  // Gestor só pode acessar seu próprio setor
  if (req.user.role === 'GESTOR') {
    const setorIdRequisitado = req.query.setor_id || req.body?.setor_id;
    
    if (setorIdRequisitado && setorIdRequisitado !== req.user.setor_id) {
      return res.status(403).json({
        erro: 'Acesso negado. Você só pode acessar dados do seu próprio setor.'
      });
    }
  }

  next();
};

export const gerarToken = (usuario) => {
  const payload = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    setor_id: usuario.setor_id,
    is_superadmin: usuario.is_superadmin || false
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d'
  });
};
