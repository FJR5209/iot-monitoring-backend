/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: scripts/deviceSimulator.js
 * DESCRIÇÃO: Simula múltiplos dispositivos IoT, enviando leituras de temperatura
 * para a nossa API em um ciclo.
 *
 * INSTRUÇÕES:
 * 1. Substitua o conteúdo do seu ficheiro existente com este novo código.
 * 2. Preencha o array `devicesToSimulate` com os nomes e as deviceKeys
 * dos 4 dispositivos que você criou na sua API.
 * 3. Para iniciar, execute no terminal: node scripts/deviceSimulator.js
 * =================================================================
 */

const axios = require('axios');

// --- CONFIGURAÇÃO DO SIMULADOR ---

// O endereço do nosso servidor backend.
const YOUR_API_URL = 'https://iot-monitoring-backend-yzqm.onrender.com/api/v1/data';

// Intervalo de envio em milissegundos.
// O script enviará dados para UM dispositivo a cada 7.5 segundos (30s / 4 dispositivos).
const SEND_INTERVAL = 7500; 

// ATUALIZAÇÃO: Lista de dispositivos a simular.
// Preencha com os dados dos seus 4 dispositivos.
const devicesToSimulate = [
    { 
        name: 'HEMOACRE',
        deviceKey: '3cc593041087f7e963209ff36ac8f483481064c0', 
        currentTemp: -20.0, // Temperatura inicial
        tempRange: { min: -25, max: -15 } // Faixa de operação normal
    }, /*
    { 
        name: 'HEMOACRE 2',
        deviceKey: '1760ed8de53a91e5d3d5b9e3dc381fd1aa390bfc', 
        currentTemp: 4.0,
        tempRange: { min: 2, max: 8 }
    },
    { 
        name: 'HEMOACRE 3',
        deviceKey: '22baacb535571ecd7300bade699268f981bed8d7', 
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
