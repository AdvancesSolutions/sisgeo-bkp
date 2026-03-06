import express from 'express';
import {
  criarSetor,
  listarSetores,
  obterSetor,
  atualizarSetor,
  deletarSetor
} from '../controllers/SetorController.js';
import { autenticar, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas de setores requerem autenticação
router.use(autenticar);

// POST /setores - Apenas Super Admin
router.post('/', superAdminOnly, criarSetor);

// GET /setores - Todos podem listar
router.get('/', listarSetores);

// GET /setores/:id
router.get('/:id', obterSetor);

// PATCH /setores/:id - Apenas Super Admin
router.patch('/:id', superAdminOnly, atualizarSetor);

// DELETE /setores/:id - Apenas Super Admin
router.delete('/:id', superAdminOnly, deletarSetor);

export default router;
