import cron from 'node-cron';
import { generateTemperatureReport } from './report.service.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import { sendEmail } from './email.service.js';

// Função para enviar relatório diário para todos os tenants
async function sendDailyReports() {
  const tenants = await Tenant.find({ status: 'active' });
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // 00:00 de hoje
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59); // 23:59 de hoje

  for (const tenant of tenants) {
    // Buscar admins do tenant
    const admins = await User.find({ tenant: tenant._id, role: 'admin' });
    if (admins.length === 0) continue;
    // Gerar PDF
    const pdfBuffer = await generateTemperatureReport(tenant._id, start, end);
    // Enviar para cada admin
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'Relatório Diário de Temperatura',
        html: '<p>Segue em anexo o relatório diário de temperatura dos seus dispositivos.</p>',
        attachments: [
          {
            content: pdfBuffer.toString('base64'),
            filename: `relatorio-temperatura-${now.toISOString().slice(0,10)}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment',
          }
        ]
      });
    }
  }
}

// Agenda para rodar todos os dias às 8h da manhã
const reportJob = cron.schedule('0 8 * * *', () => {
  sendDailyReports().catch(err => console.error('[CRON] Erro ao enviar relatórios:', err));
});

export function startReportJob() {
  reportJob.start();
  console.log('✅ Job de relatórios diários iniciado.');
} 