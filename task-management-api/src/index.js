import 'dotenv/config';
import express from 'express';
import { database } from './database/connection.js';
import { tratarErros } from './middleware/erros.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import setoresRoutes from './routes/setores.js';
import tarefasRoutes from './routes/tarefas.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Permitir requisições do frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rotas
app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/setores', setoresRoutes);
app.use('/tarefas', tarefasRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Rota raiz com informações da API
app.get('/', (req, res) => {
  res.status(200).json({
    nome: 'Task Management API',
    versao: '1.0.0',
    descricao: 'Sistema de Gestão de Tarefas por Setores com Controle de Acesso por Função',
    endpoints: {
      auth: '/auth',
      usuarios: '/usuarios',
      setores: '/setores',
      tarefas: '/tarefas',
      health: '/health'
    },
    documentacao: 'Consulte o README.md para mais informações'
  });
});

// Tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({
    erro: 'Endpoint não encontrado',
    path: req.path,
    metodo: req.method
  });
});

// Middleware de tratamento de erros
app.use(tratarErros);

// Inicializar aplicação
async function iniciar() {
  try {
    await database.init();
    console.log('✅ Banco de dados inicializado');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`📚 Documentação: http://localhost:${PORT}/`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

iniciar();

// Tratamento de erro não capturado
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
