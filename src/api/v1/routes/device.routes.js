/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/routes/device.routes.js
 * DESCRIÇÃO: Adicionadas as rotas de GET, PUT e DELETE.
 * =================================================================
 */
const express = require('express');
const router = express.Router();
const { 
    createDevice, 
    getAllDevices, 
    getDeviceById, 
    updateDevice, 
    deleteDevice 
} = require('../controllers/device.controller');
const { protect } = require('../../../midleware/auth.middleware');

// Agrupa todas as rotas sob a proteção de autenticação
router.use(protect);

// Rotas do CRUD de Dispositivos
router.route('/')
    .post(createDevice)
    .get(getAllDevices);

router.route('/:id')
    .get(getDeviceById)
    .put(updateDevice)
    .delete(deleteDevice);

module.exports = router;