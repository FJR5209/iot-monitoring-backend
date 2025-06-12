/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/routes/data.routes.js
 * DESCRIÇÃO: Corrigido para usar a desestruturação na importação.
 * =================================================================
 */
const express = require('express');
const router = express.Router();
const { ingestData } = require('../controllers/data.controller');

router.post('/', ingestData);

module.exports = router;