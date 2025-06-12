// Ficheiro: src/app.js
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./api/v1'); // <-- Importa o index.js de cima

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Servidor de Monitorização IoT está no ar!'
  });
});

// Ativação de todas as rotas da V1
app.use('/api/v1', apiRoutes); // <-- Esta linha é crucial

app.use((req, res, next) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ocorreu um erro interno no servidor' });
});

module.exports = app;