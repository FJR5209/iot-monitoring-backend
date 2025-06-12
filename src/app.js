/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/app.js (no seu projeto backend)
 * DESCRIÇÃO: Configuração do CORS atualizada para permitir pedidos de qualquer origem.
 * =================================================================
 */
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./api/v1');

const app = express();

// --- ATUALIZAÇÃO IMPORTANTE ---
// Configuramos o CORS para aceitar pedidos de qualquer domínio.
// Isto é essencial para que o seu frontend (no Netlify) consiga comunicar com o seu backend (no Render).
app.use(cors({
    origin: '*' // Permite todas as origens
}));

// Middlewares essenciais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de "health check" para verificar se o servidor está no ar
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Servidor de Monitorização IoT está no ar!'
  });
});

// Delega as rotas da API para o módulo de rotas
app.use('/api/v1', apiRoutes);

// Middleware para tratar rotas não encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware para tratamento de erros genéricos
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ocorreu um erro interno no servidor' });
});

module.exports = app;
