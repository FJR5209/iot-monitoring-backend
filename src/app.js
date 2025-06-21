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
import './services/report.job.js';

const app = express();

// --- INÍCIO DA CORREÇÃO DE CORS PARA PRODUÇÃO ---

// Lista de origens permitidas
const allowedOrigins = [
  'http://127.0.0.1:5500',      // Ambiente de desenvolvimento local
  'http://localhost:3000',      // Outro ambiente local comum
  'http://localhost:5500',      // Variação do localhost
  'http://127.0.0.1:3000',      // Variação do 127.0.0.1
  'https://fjr5209.github.io'   // Frontend em produção no GitHub Pages
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições que não têm 'origin' (ex: Postman, apps mobile)
    if (!origin) return callback(null, true);
    
    // Em desenvolvimento, permite todas as origens locais
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'A política de CORS para este site não permite acesso da Origem especificada.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar o middleware com as opções como o primeiro da pilha
app.use(cors(corsOptions));

// Middleware adicional para garantir headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// --- FIM DA CORREÇÃO DE CORS PARA PRODUÇÃO ---


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

// Middlewares de segurança
app.use(helmet()); // Proteção de headers HTTP

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

// Rota de teste CORS
app.get('/api/v1/test-cors', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CORS está funcionando corretamente!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
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
