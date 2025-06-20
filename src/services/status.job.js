import cron from 'node-cron';
import Device from '../models/Device.js';

async function checkOfflineDevices() {
  try {
    const onlineDevices = await Device.find({ isOnline: true });

    for (const device of onlineDevices) {
      const now = new Date();
      const lastSeen = new Date(device.lastSeen);
      const intervalSeconds = device.heartbeatInterval || 300;
      const timeDiffSeconds = (now - lastSeen) / 1000;

      // Para evitar falsos negativos, consideramos offline apenas se o tempo
      // sem comunicação for 1.5x maior que o intervalo de heartbeat esperado.
      // Isso dá uma margem de tolerância para atrasos de rede.
      if (timeDiffSeconds > (intervalSeconds * 1.5)) {
        console.log(`Dispositivo ${device.name} (${device._id}) está offline. Última vez visto há ${Math.round(timeDiffSeconds)}s.`);
        device.isOnline = false;
        await device.save();
      }
    }
  } catch (error) {
    console.error('Erro ao verificar dispositivos offline:', error);
  }
}

// Roda a cada minuto
const statusCheckJob = cron.schedule('* * * * *', () => {
  checkOfflineDevices();
});

export function startStatusCheckJob() {
  statusCheckJob.start();
  console.log('✅ Job de verificação de status iniciado.');
} 