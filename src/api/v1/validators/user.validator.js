/*
 * =================================================================
 * FICHEIRO NOVO: src/api/v1/validators/user.validator.js
 * DESCRIÇÃO: Regras de validação para as rotas de utilizadores.
 * =================================================================
 */
import { body } from 'express-validator';
import validate from '../../../midleware/validation.middleware.js';

export const updateUserValidator = [
    body('email').optional().isEmail().withMessage('Por favor, forneça um e-mail válido.'),
    body('role').optional().isIn(['admin', 'viewer']).withMessage('A função deve ser "admin" ou "viewer".'),
    validate
];

export const updateMyProfileValidator = [
    body('name').optional().notEmpty().withMessage('O nome não pode ficar em branco.'),
    body('email').optional().isEmail().withMessage('Por favor, forneça um e-mail válido.'),
    validate
];