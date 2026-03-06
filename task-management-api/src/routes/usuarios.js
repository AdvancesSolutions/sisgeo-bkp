import express from 'express';
import {
  criarUsuario,
  listarUsuarios,
  obterUsuario,
  atualizarUsuario,
  deletarUsuario,
  alterarSenha
} from '../controllers/UsuarioController.js';
import { autenticar, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas de usuário requerem autenticação
router.use(autenticar);

// POST /usuarios - Super Admin e Gestor podem criar
router.post('/', criarUsuario);

// GET /usuarios - Super Admin vê todos, Gestor vê seu setor
router.get('/', listarUsuarios);

// GET /usuarios/:id
router.get('/:id', obterUsuario);

// PATCH /usuarios/:id - Super Admin para alterar, usuário pode alterar a si mesmo
router.patch('/:id', atualizarUsuario);

// POST /usuarios/:id/alterar-senha - Alterar senha
router.post('/:id/alterar-senha', alterarSenha);

// DELETE /usuarios/:id - Apenas Super Admin
router.delete('/:id', superAdminOnly, deletarUsuario);

export default router;
