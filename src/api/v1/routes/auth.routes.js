/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/routes/auth.routes.js
 * DESCRIÇÃO: Aplica os validadores às rotas correspondentes.
 * =================================================================
 */
import express from 'express';
import { register, login, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/auth.validator.js';

const router = express.Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.patch('/reset-password/:token', resetPasswordValidator, resetPassword);

export default router;
