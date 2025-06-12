/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/index.js
 * DESCRIÇÃO: Adicionar as novas rotas de utilizador à API.
 * =================================================================
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./routes/auth.routes');
const deviceRoutes = require('./routes/device.routes');
const dataRoutes = require('./routes/data.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const userRoutes = require('./routes/user.routes'); // <-- IMPORTAR

router.get('/', (req, res) => {
    res.json({ message: 'Bem-vindo à API de Monitorização v1' });
});

// Agrupa as rotas
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/data', dataRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes); // <-- USAR A NOVA ROTA

module.exports = router;