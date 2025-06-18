/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/routes/data.routes.js
 * DESCRIÇÃO: Corrigido para usar a desestruturação na importação.
 * =================================================================
 */
import express from 'express';
import { ingestData, getDeviceReadings, getLatestReadings } from '../controllers/data.controller.js';
import { protect } from '../../../midleware/auth.middleware.js';

const router = express.Router();

// Rota pública para ingestão de dados
router.post('/', ingestData);

// Rotas protegidas para consulta de dados
router.use(protect);
router.get('/device/:deviceId', getDeviceReadings);
router.get('/latest', getLatestReadings);

export default router;