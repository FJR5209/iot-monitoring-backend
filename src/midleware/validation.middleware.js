/*
 * =================================================================
 * FICHEIRO NOVO: src/middleware/validation.middleware.js
 * DESCRIÇÃO: Middleware que centraliza a lógica de validação.
 * =================================================================
 */
import { validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  // Extrai as mensagens de erro e envia uma resposta 400 (Bad Request)
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(400).json({
    errors: extractedErrors,
  });
};

export default validate;

// To suppress MaxListenersExceededWarning globally (optional, place in your main entry file, e.g., app.js or server.js):
// import { EventEmitter } from 'events';
// EventEmitter.defaultMaxListeners = 20;

