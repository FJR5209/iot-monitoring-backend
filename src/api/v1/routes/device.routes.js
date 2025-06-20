/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/routes/device.routes.js
 * DESCRIÇÃO: Aplica o validador às rotas de criação e atualização.
 * =================================================================
 */
import express from 'express';
import { 
    createDevice, 
    getAllDevices, 
    getDeviceById, 
    updateDevice, 
    deleteDevice,
    deviceHeartbeat,
    getDeviceStatus
} from '../controllers/device.controller.js';
import { protect } from '../../../midleware/auth.middleware.js';
import { deviceValidator } from '../validators/device.validator.js';
import { getDeviceReadings } from '../controllers/data.controller.js';

const router = express.Router();

// Protege todas as rotas de dispositivos
router.use(protect);

// ATIVAÇÃO: O 'deviceValidator' agora é executado antes de 'createDevice' e 'updateDevice'
router.route('/')
    .post(deviceValidator, createDevice)
    .get(getAllDevices);

router.route('/:id')
    .get(getDeviceById)
    .put(deviceValidator, updateDevice)
    .delete(deleteDevice);

// Rota para leituras do dispositivo
router.get('/:id/readings', getDeviceReadings);

// Rota para o heartbeat do dispositivo (não precisa de 'protect' pois usa deviceKey)
router.post('/:id/heartbeat', deviceHeartbeat);

// Rota para obter o status de um dispositivo
router.get('/:id/status', getDeviceStatus);

export default router;