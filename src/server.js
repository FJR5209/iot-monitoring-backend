const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3000;

// Conecta à base de dados
connectDB();

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT} em modo ${process.env.NODE_ENV}`);
});