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

// Rota de health check da API
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'API de Monitorização IoT v1 está funcionando!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Agrupa as rotas
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/data', dataRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);

export default router;