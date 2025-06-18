/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/index.js
 * DESCRIÇÃO: Adicionar as novas rotas de utilizador à API.
 * =================================================================
 */
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import deviceRoutes from './routes/device.routes.js';
import dataRoutes from './routes/data.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import userRoutes from './routes/user.routes.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Bem-vindo à API de Monitorização v1' });
});

// Agrupa as rotas
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/data', dataRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);

export default router;