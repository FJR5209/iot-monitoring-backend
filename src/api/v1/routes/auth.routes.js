/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/routes/auth.routes.js
 * DESCRIÇÃO: Ficheiro completo com todas as rotas de autenticação,
 * incluindo as novas para recuperação de senha.
 * =================================================================
 */
const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    forgotPassword, 
    resetPassword 
} = require('../controllers/auth.controller');

// Rota para registar um novo utilizador
router.post('/register', register);

// Rota para fazer login
router.post('/login', login);

// Rota para solicitar a recuperação de senha
router.post('/forgot-password', forgotPassword);

// Rota para redefinir a senha com o token recebido por e-mail
router.patch('/reset-password/:token', resetPassword);

module.exports = router;
