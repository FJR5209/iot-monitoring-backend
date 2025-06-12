/*
 * =================================================================
 * FICHEIRO A CRIAR: scripts/importFromThingSpeak.js
 * INSTRUÇÕES:
 * 1. Crie uma nova pasta chamada "scripts" na raiz do seu projeto.
 * 2. Dentro dessa pasta, crie este ficheiro "importFromThingSpeak.js".
 * =================================================================
 */

// Usaremos 'axios' para fazer os pedidos HTTP de forma mais simples.
// Se ainda não o tiver, instale-o no terminal: npm install axios
const axios = require('axios');

// --- DADOS DE CONFIGURAÇÃO ---
const THINGSPEAK_CHANNEL_ID = '2756218';
const THINGSPEAK_READ_API_KEY = '640JATNQ9A7K8ZN7';
const NUM_RESULTS_TO_FETCH = 50; // Quantos pontos de dados buscar do ThingSpeak

// --- CONFIGURAÇÃO DO NOSSO SERVIDOR ---
// A 'deviceKey' do dispositivo que criámos na nossa API.
// Vá à sua base de dados (MongoDB Compass) ou à resposta do Postman para encontrar a chave.
const YOUR_DEVICE_KEY = '3cc593041087f7e963209ff36ac8f483481064c0'; 
const YOUR_API_URL = 'http://localhost:3000/api/v1/data';


// Função principal que executa o processo de importação
async function importData() {
    console.log('A iniciar a importação de dados do ThingSpeak...');

    if (YOUR_DEVICE_KEY === '3cc593041087f7e963209ff36ac8f483481064c0') {
        console.error('\nERRO: Por favor, edite este ficheiro e insira a sua `deviceKey` na variável YOUR_DEVICE_KEY.');
        return;
    }

    try {
        // 1. Buscar os dados da API do ThingSpeak
        const thingSpeakUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/fields/1.json?api_key=${THINGSPEAK_READ_API_KEY}&results=${NUM_RESULTS_TO_FETCH}`;
        
        console.log(`A buscar dados de: ${thingSpeakUrl}`);
        const response = await axios.get(thingSpeakUrl);
        const feeds = response.data.feeds;

        if (!feeds || feeds.length === 0) {
            console.log('Nenhum dado encontrado no canal do ThingSpeak.');
            return;
        }

        console.log(`${feeds.length} registos de temperatura encontrados. A iniciar a inserção no nosso servidor...`);

        // 2. Iterar sobre cada leitura e enviá-la para o nosso servidor
        for (const feed of feeds) {
            const temperature = parseFloat(feed.field1);

            // Ignora leituras nulas ou inválidas
            if (feed.field1 === null || isNaN(temperature)) {
                continue;
            }

            const payload = {
                deviceKey: YOUR_DEVICE_KEY,
                temperature: temperature,
            };

            try {
                // Faz o pedido POST para a nossa API, simulando o ESP8266
                await axios.post(YOUR_API_URL, payload, {
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log(`> Inserida temperatura: ${temperature}°C`);
            } catch (apiError) {
                // Mostra o erro da nossa API se algo falhar (ex: deviceKey errada)
                console.error(`! Erro ao inserir ${temperature}°C:`, apiError.response ? apiError.response.data.message : apiError.message);
            }
        }

        console.log('\nImportação concluída com sucesso!');

    } catch (error) {
        console.error('\nERRO FATAL: Falha ao buscar dados do ThingSpeak. Verifique o Channel ID e a Read API Key.');
        // console.error(error); // Descomente para ver o erro completo
    }
}

// Executa a função
importData();
