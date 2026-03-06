import express from 'express';
import {
  criarTarefa,
  listarTarefas,
  obterTarefa,
  atualizarTarefa,
  deletarTarefa,
  obterEstatisticas
} from '../controllers/TarefaController.js';
import { autenticar, gestorOnly, gestorOuFuncionarioOnly } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas de tarefas requerem autenticação
router.use(autenticar);

// POST /tarefas - Apenas Gestor
router.post('/', gestorOnly, criarTarefa);

// GET /tarefas - Gestor vê seu setor, Funcionário vê suas tarefas
router.get('/', gestorOuFuncionarioOnly, listarTarefas);

// GET /tarefas/stats - Obter estatísticas
router.get('/stats', obterEstatisticas);

// GET /tarefas/:id
router.get('/:id', gestorOuFuncionarioOnly, obterTarefa);

// PATCH /tarefas/:id - Gestor atualiza tudo, Funcionário apenas status
router.patch('/:id', gestorOuFuncionarioOnly, atualizarTarefa);

// DELETE /tarefas/:id - Apenas Gestor/Criador
router.delete('/:id', gestorOnly, deletarTarefa);

export default router;
