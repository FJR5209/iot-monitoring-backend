/*
 * =================================================================
 * FICHEIRO NOVO: src/api/v1/validators/device.validator.js
 * DESCRIÇÃO: Regras de validação para as rotas de dispositivos.
 * =================================================================
 */
import { body } from 'express-validator';
import validate from '../../../midleware/validation.middleware.js';

export const deviceValidator = [
    body('name').notEmpty().trim().withMessage('O nome do dispositivo é obrigatório.'),
    body('tempMin').isNumeric().withMessage('A temperatura mínima deve ser um número.'),
    body('tempMax').isNumeric().withMessage('A temperatura máxima deve ser um número.'),
    validate
];
