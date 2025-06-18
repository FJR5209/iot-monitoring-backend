/*
 * =================================================================
 * FICHEIRO NOVO: src/api/v1/validators/auth.validator.js
 * DESCRIÇÃO: Define as regras de validação para as rotas de autenticação.
 * =================================================================
 */
import { body } from 'express-validator';
import validate from '../../../midleware/validation.middleware.js';

// Regras para o registo de um novo utilizador
export const registerValidator = [
    body('name').notEmpty().withMessage('O nome do utilizador é obrigatório.'),
    body('email').isEmail().withMessage('Por favor, forneça um e-mail válido.'),
    body('password').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres.'),
    body('tenantName').notEmpty().withMessage('O nome da empresa é obrigatório.'),
    validate // O nosso middleware que executa a validação
];

// Regras para o login
export const loginValidator = [
    body('email').isEmail().withMessage('Por favor, forneça um e-mail válido.'),
    body('password').notEmpty().withMessage('A senha é obrigatória.'),
    validate
];

// Regras para solicitar recuperação de senha
export const forgotPasswordValidator = [
    body('email').isEmail().withMessage('Por favor, forneça um e-mail válido.'),
    validate
];

// Regras para redefinir a senha
export const resetPasswordValidator = [
    body('password').isLength({ min: 6 }).withMessage('A nova senha deve ter pelo menos 6 caracteres.'),
    validate
];