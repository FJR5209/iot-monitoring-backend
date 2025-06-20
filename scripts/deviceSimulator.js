import axios from 'axios';

// --- CONFIGURAÇÃO DO SIMULADOR ---

// O endereço do nosso servidor backend.
const YOUR_API_URL = 'http://localhost:3000/api/v1/data';

// Intervalo de envio em milissegundos.
// O script enviará dados para UM dispositivo a cada 7.5 segundos (30s / 4 dispositivos).
const SEND_INTERVAL = 7500; 

// ATUALIZAÇÃO: Lista de dispositivos a simular.
// Preencha com os dados dos seus 4 dispositivos.
const devicesToSimulate = [
    { 
        name: 'HEMOACRE 2',
        deviceKey: 'e665586bae1ef800cb54e385758462b1fe89c07d', 
        currentTemp: -20.0, // Temperatura inicial
        tempRange: { min: -25, max: -15 } // Faixa de operação normal
    },/* 
    { 
        name: 'Teste Direto via ThunderClient',
        deviceKey: '4e79d7559936f5dcdb1ded8671bf586e06efbcdd', 
        currentTemp: 4.0,
        tempRange: { min: 2, max: 8 }
    },
    { 
        name: 'HEMOACRE ',
        deviceKey: '1b738b40b063d3520457bc21f2ed5035fc7156df', 
        currentTemp: 5.5,
        tempRange: { min: 2, max: 8 }
    }, 
    { 
        name: 'HEMOACRE 4',
        deviceKey: '7362364d73d0d809612974a273a1e4c5d548d474', 
        currentTemp: 22.0,
        tempRange: { min: 20, max: 25 }
    }*/
];

// --- LÓGICA DE SIMULAÇÃO DE TEMPERATURA ---

let currentDeviceIndex = 0;

function generateRealisticTemperature(device) {
  // Gera uma pequena variação, entre -0.5 e +0.5 graus.
  const fluctuation = (Math.random() - 0.5);
  device.currentTemp += fluctuation;

  // Garante que a temperatura não fuja absurdamente da sua faixa normal.
  if (device.currentTemp > device.tempRange.max + 2) device.currentTemp = device.tempRange.max + 2;
  if (device.currentTemp < device.tempRange.min - 2) device.currentTemp = device.tempRange.min - 2;

  return parseFloat(device.currentTemp.toFixed(2));
}

// --- FUNÇÃO DE ENVIO ---

async function sendData() {
  // Pega o dispositivo da vez.
  const device = devicesToSimulate[currentDeviceIndex];

  if (!device.deviceKey || device.deviceKey.startsWith('COLE_A_DEVICE_KEY')) {
    console.error(`\n[ERRO] A simulação para "${device.name}" está parada. Por favor, insira a sua deviceKey.`);
    // Move para o próximo dispositivo no próximo ciclo.
    currentDeviceIndex = (currentDeviceIndex + 1) % devicesToSimulate.length;
    return;
  }

  const simulatedTemperature = generateRealisticTemperature(device);

  const payload = {
    deviceKey: device.deviceKey,
    temperature: simulatedTemperature,
  };

  try {
    console.log(`[${new Date().toLocaleTimeString()}] A simular "${device.name}": Temperatura de ${simulatedTemperature}°C`);
    
    // Faz o pedido POST para a nossa API.
    await axios.post(YOUR_API_URL, payload);

    console.log(`> [SUCESSO] Dados de "${device.name}" enviados.`);

  } catch (error) {
    console.error(`> [FALHA] Não foi possível enviar os dados de "${device.name}".`);
    console.error(`  Motivo: ${error.response ? error.response.data.message : error.message}`);
  }

  // Prepara para enviar os dados do próximo dispositivo no próximo ciclo.
  currentDeviceIndex = (currentDeviceIndex + 1) % devicesToSimulate.length;
}

// --- INÍCIO DA SIMULAÇÃO ---

console.log('===================================================');
console.log('      INICIANDO SIMULADOR DE MÚLTIPLOS DISPOSITIVOS     ');
console.log(`   Enviando dados para 1 dispositivo a cada ${SEND_INTERVAL / 1000} segundos.`);
console.log('   Pressione Ctrl + C para parar.');
console.log('===================================================');

// Inicia o ciclo que chama a função sendData repetidamente.
setInterval(sendData, SEND_INTERVAL);
