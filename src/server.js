import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/database.js';
import { startReportJob } from './services/report.job.js';
import { startStatusCheckJob } from './services/status.job.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;

// Conecta à base de dados
connectDB();

startReportJob(); // Inicia o job de relatórios
startStatusCheckJob(); // Inicia o job de verificação de status

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT} em modo ${process.env.NODE_ENV}`);
});