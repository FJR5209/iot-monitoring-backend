import PDFDocument from 'pdfkit';
import fs from 'fs';
import * as simpleStats from 'simple-statistics';
import DataReading from '../models/DataReading.js';
import Device from '../models/Device.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const LOGO_PATH = 'logo.png'; // Salve o logo enviado na raiz do projeto
const chartWidth = 500;
const chartHeight = 250;
const chartCanvas = new ChartJSNodeCanvas({ width: chartWidth, height: chartHeight });

/**
 * Gera um relatório PDF de temperatura para um tenant em um determinado período.
 * @param {ObjectId} tenantId - ID do tenant
 * @param {Date} startDate - Data de início
 * @param {Date} endDate - Data de fim
 * @param {Array} [deviceIdsFilter] - Lista de IDs de dispositivos a incluir (opcional)
 * @returns {Promise<Buffer>} - Buffer do PDF gerado
 */
export async function generateTemperatureReport(tenantId, startDate, endDate, deviceIdsFilter = null) {
  let devices = await Device.find({ tenant: tenantId });
  if (deviceIdsFilter) {
    devices = devices.filter(d => deviceIdsFilter.some(id => d._id.equals(id)));
  }
  const deviceIds = devices.map(d => d._id);
  const readings = await DataReading.find({
    tenant: tenantId,
    device: { $in: deviceIds },
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: 1 });

  const readingsByDevice = {};
  devices.forEach(device => {
    readingsByDevice[device._id] = [];
  });
  readings.forEach(r => {
    readingsByDevice[r.device].push(r);
  });

  const doc = new PDFDocument({ margin: 40 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  // Logo
  try {
    doc.image(LOGO_PATH, doc.page.width/2 - 50, undefined, { width: 100, align: 'center' });
  } catch (e) {}
  doc.moveDown();

  // Título
  doc.fontSize(22).fillColor('#2c3e50').text('Relatório Diário de Temperatura', { align: 'center', underline: true });
  doc.moveDown();

  // Mensagem de abertura
  const dataInicio = startDate.toLocaleDateString();
  const dataFim = endDate.toLocaleDateString();
  const periodoTexto = (dataInicio === dataFim)
    ? `no dia ${dataInicio}`
    : `no período de ${dataInicio} a ${dataFim}`;
  doc.fontSize(12).fillColor('#333').text(
    `Prezado(a),\n\nSegue o relatório detalhado das temperaturas monitoradas ${periodoTexto}.\n\nEste relatório apresenta estatísticas, períodos de pico, sugestões e gráficos para facilitar a análise e a tomada de decisão. Em caso de dúvidas, entre em contato com o suporte do Sistema de Monitorização IoT.\n`,
    { align: 'justify' }
  );
  doc.moveDown();

  // Todos os dispositivos em uma única página
  for (const device of devices) {
    doc.x = doc.page.margins.left; // Garante alinhamento à esquerda
    doc.moveDown(1); // Espaçamento consistente entre dispositivos
    const deviceReadings = readingsByDevice[device._id];
    doc.fontSize(16).fillColor('#1565c0').text(`Dispositivo: ${device.name}`, { underline: true, align: 'left' });
    doc.moveDown(0.5);
    if (deviceReadings.length === 0) {
      doc.fontSize(12).fillColor('#333').text('Sem dados para o período.', { align: 'left' });
      doc.moveDown();
      continue;
    }
    const temps = deviceReadings.map(r => r.temperature);
    const labels = deviceReadings.map(r => r.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    const min = simpleStats.min(temps);
    const max = simpleStats.max(temps);
    const mean = simpleStats.mean(temps);
    const std = simpleStats.standardDeviation(temps);
    const meanArray = Array(temps.length).fill(mean);
    const stdUpper = meanArray.map(m => m + std);
    const stdLower = meanArray.map(m => m - std);
    const peaks = deviceReadings.filter(r => r.temperature > device.settings.tempMax || r.temperature < device.settings.tempMin);
    // Estatísticas
    doc.fontSize(12).fillColor('#333').text(`Mínima: ${min.toFixed(2)}°C | Máxima: ${max.toFixed(2)}°C | Média: ${mean.toFixed(2)}°C | Desvio padrão: ${std.toFixed(2)}`);
    doc.moveDown(0.5);
    // Gráfico de colunas com linha
    try {
      const chartConfig = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              type: 'bar',
              label: 'Temperatura (°C)',
              data: temps,
              backgroundColor: 'rgba(25, 118, 210, 0.5)',
              borderColor: '#1976d2',
              borderWidth: 1
            },
            {
              type: 'line',
              label: 'Média',
              data: Array(temps.length).fill(mean),
              borderColor: '#388e3c',
              borderWidth: 2,
              borderDash: [8, 4],
              pointRadius: 0,
              fill: false,
              tension: 0
            },
            {
              type: 'line',
              label: 'Limite Máximo',
              data: Array(temps.length).fill(device.settings.tempMax),
              borderColor: '#d32f2f',
              borderWidth: 2,
              borderDash: [6, 6],
              pointRadius: 0,
              fill: false,
              order: 0
            },
            {
              type: 'line',
              label: 'Limite Mínimo',
              data: Array(temps.length).fill(device.settings.tempMin),
              borderColor: '#fbc02d',
              borderWidth: 2,
              borderDash: [6, 6],
              pointRadius: 0,
              fill: false,
              order: 0
            }
          ]
        },
        options: {
          responsive: false,
          plugins: {
            legend: { display: true, labels: { color: '#222', font: { size: 12 } } },
            title: {
              display: true,
              text: 'Temperatura: Colunas e Linha de Média',
              color: '#222',
              font: { size: 18, weight: 'bold' }
            }
          },
          layout: { padding: 20 },
          scales: {
            x: {
              title: { display: true, text: 'Horário', color: '#222', font: { size: 12 } },
              ticks: { color: '#222', font: { size: 10 }, maxTicksLimit: 8 },
              grid: { color: 'rgba(200,200,200,0.3)' }
            },
            y: {
              title: { display: true, text: 'Temperatura (°C)', color: '#222', font: { size: 12 } },
              ticks: { color: '#222', font: { size: 10 } },
              grid: { color: 'rgba(200,200,200,0.3)' },
              min: Math.min(...temps, device.settings.tempMin) - 2,
              max: Math.max(...temps, device.settings.tempMax) + 2
            }
          }
        }
      };
      const chartImage = await chartCanvas.renderToBuffer(chartConfig);
      doc.image(chartImage, { width: 480, align: 'center' });
      doc.moveDown(0.5);
      // Estatísticas em caixas coloridas
      const statBoxWidth = 120;
      const statBoxHeight = 28;
      const startX = doc.x; // Alinhar à margem esquerda
      const y = doc.y;
      // Máxima
      doc.save().rect(startX, y, statBoxWidth, statBoxHeight).fill('#d32f2f');
      doc.fillColor('#fff').fontSize(13).text(`Máxima: ${max.toFixed(2)}°C`, startX + 10, y + 7);
      // Mínima
      doc.restore().save().rect(startX + statBoxWidth + 10, y, statBoxWidth, statBoxHeight).fill('#1976d2');
      doc.fillColor('#fff').fontSize(13).text(`Mínima: ${min.toFixed(2)}°C`, startX + statBoxWidth + 20, y + 7);
      // Média
      doc.restore().save().rect(startX + 2 * (statBoxWidth + 10), y, statBoxWidth, statBoxHeight).fill('#388e3c');
      doc.fillColor('#fff').fontSize(13).text(`Média: ${mean.toFixed(2)}°C`, startX + 2 * (statBoxWidth + 10) + 10, y + 7);
      doc.restore();
      doc.moveDown(2);
    } catch (e) {
      doc.fontSize(10).fillColor('red').text('Falha ao carregar gráfico: ' + e.message);
      console.error('Erro ao gerar gráfico:', e);
    }
    // Períodos de pico
    if (peaks.length > 0) {
      const firstPeak = peaks[0];
      const lastPeak = peaks[peaks.length - 1];
      const minPeak = Math.min(...peaks.map(p => p.temperature));
      const maxPeak = Math.max(...peaks.map(p => p.temperature));
      const firstTime = firstPeak.timestamp.toLocaleTimeString();
      const lastTime = lastPeak.timestamp.toLocaleTimeString();
      const dataTexto = firstPeak.timestamp.toLocaleDateString();
      doc.fontSize(12).fillColor('#d32f2f').text(
        `Foram identificados ${peaks.length} períodos de pico de temperatura no dia ${dataTexto}. ` +
        `Os picos ocorreram principalmente entre ${firstTime} e ${lastTime}, ` +
        `com temperaturas variando de ${minPeak.toFixed(2)}°C a ${maxPeak.toFixed(2)}°C. ` +
        `Recomenda-se atenção especial a esse intervalo, pois as temperaturas ficaram fora dos limites definidos para o equipamento. ` +
        `Consulte o sistema para análise detalhada dos horários e valores.`,
        { align: 'justify' }
      );
    } else {
      doc.fontSize(12).fillColor('#388e3c').text('Sem períodos de pico identificados.', { align: 'left' });
    }
    doc.moveDown();
    // Sugestões
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#333').text('Sugestões:');
    doc.font('Helvetica').fontSize(12);
    if (max > device.settings.tempMax) {
      doc.fillColor('#f57c00').text('- Considere melhorar a ventilação ou refrigeração.', { align: 'left' });
    }
    if (min < device.settings.tempMin) {
      doc.fillColor('#f57c00').text('- Verifique se o ambiente não está exposto a baixas temperaturas excessivas.', { align: 'left' });
    }
    if (std > 2) {
      doc.fillColor('#f57c00').text('- As variações estão altas, monitore possíveis falhas no equipamento.', { align: 'left' });
    }
    doc.moveDown();
    doc.moveDown(0.5);
    doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#e0e0e0'); // linha separadora
    doc.moveDown(0.5);
  }

  // Rodapé
  doc.fontSize(10).fillColor('#888').text(`Relatório gerado em ${new Date().toLocaleString()} | Sistema de Monitorização IoT`, 40, doc.page.height - 40, { align: 'center' });

  doc.end();
  return await new Promise(resolve => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
  });
} 