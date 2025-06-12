/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/routes/user.routes.js
 * DESCRIÇÃO: Reordenadas as rotas para corrigir o erro 'Cast to ObjectId failed'.
 * =================================================================
 */
const express = require('express');
const router = express.Router();
const { 
    getAllUsers, 
    updateUser, 
    deleteUser,
    getMyProfile,
    updateMyProfile
} = require('../controllers/user.controller');
const { protect } = require('../../../midleware/auth.middleware');

// Todas as rotas de utilizador são protegidas pelo middleware de autenticação
router.use(protect);

// ROTA ESPECÍFICA: '/me' para o perfil do utilizador logado
// DEVE VIR ANTES da rota genérica '/:id' para evitar conflitos.
router.route('/me')
    .get(getMyProfile)
    .put(updateMyProfile);

// ROTA DE ADMIN: Listar todos os utilizadores
router.route('/')
    .get(getAllUsers);

// ROTAS DE ADMIN: Gerir um utilizador específico por ID
router.route('/:id')
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;
