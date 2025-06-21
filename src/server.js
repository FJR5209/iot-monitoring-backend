import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/database.js';
import { startReportJob } from './services/report.job.js';
import { startStatusCheckJob } from './services/status.job.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Verificar se as variáveis críticas estão definidas
if (!process.env.DB_URI) {
  console.warn('⚠️  AVISO: DB_URI não encontrada. Verifique se o arquivo .env existe.');
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  AVISO: JWT_SECRET não encontrada. Verifique se o arquivo .env existe.');
}

const PORT = process.env.PORT || 3000;

// Conecta à base de dados
connectDB();

startReportJob(); // Inicia o job de relatórios
startStatusCheckJob(); // Inicia o job de verificação de status

app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 CORS configurado para: http://127.0.0.1:5500, http://localhost:3000, https://fjr5209.github.io`);
});