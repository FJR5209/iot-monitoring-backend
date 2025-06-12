/*
 * =================================================================
 * FICHEIRO NOVO: src/api/v1/routes/user.routes.js
 * DESCRIÇÃO: Novas rotas para o CRUD de Utilizadores.
 * =================================================================
 */
const express = require('express');
const router = express.Router();
const { getAllUsers, updateUser, deleteUser } = require('../controllers/user.controller');
const { protect } = require('../../../midleware/auth.middleware');

// Todas as rotas de utilizador são protegidas
router.use(protect);

router.route('/')
    .get(getAllUsers); // Rota para listar utilizadores

router.route('/:id')
    .put(updateUser)    // Rota para atualizar um utilizador
    .delete(deleteUser); // Rota para apagar um utilizador

module.exports = router;