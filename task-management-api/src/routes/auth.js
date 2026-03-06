import express from 'express';
import { login, perfil, me } from '../controllers/AuthController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/perfil', autenticar, perfil);
router.get('/me', autenticar, me);

export default router;
