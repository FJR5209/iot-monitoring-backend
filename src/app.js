/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/app.js
 * DESCRIÇÃO: Configuração completa de segurança para o backend.
 * =================================================================
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import passwordValidator from 'password-validator';
import { body } from 'express-validator';
import apiRoutes from './api/v1/index.js';

const app = express();

// Configuração do logger
const logger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Configuração do validador de senha
const schema = new passwordValidator();
schema
  .is().min(8)
  .has().uppercase()
  .has().lowercase()
  .has().digits()
  .has().symbols()
  .has().not().spaces();

// Configuração do rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200, // limite de 200 requisições por IP
  message: 'Muitas requisições deste IP, por favor tente novamente mais tarde.'
});

const allowedOrigins = [
  'http://127.0.0.1:5500', // para testes locais
  'http://localhost:3000', // se usar React local
  'https://fjr5209.github.io' // seu frontend em produção
];

// Middlewares de segurança
app.use(helmet()); // Proteção de headers HTTP
app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (ex: ferramentas internas)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares essenciais
app.use(express.json({ limit: '10kb' })); // Limita o tamanho do payload
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(limiter);

// Timeout para requisições
app.use((req, res, next) => {
  req.setTimeout(5000); // 5 segundos
  res.setTimeout(5000);
  next();
});

// Logging de requisições

// Rota de "health check"
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Servidor de Monitorização IoT está no ar!'
  });
});

// Delega as rotas da API
app.use('/api/v1', apiRoutes);

// Middleware para tratar rotas não encontradas (404)
app.use((req, res, next) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Ocorreu um erro interno no servidor' 
      : err.message
  });
});

export default app;
