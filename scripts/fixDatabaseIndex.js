/*
 * =================================================================
 * FICHEIRO A CRIAR: scripts/fixDatabaseIndex.js
 * DESCRIÇÃO: Este script conecta-se à sua base de dados no Atlas
 * e remove o índice problemático que está a causar o erro.
 *
 * INSTRUÇÕES:
 * 1. Crie este ficheiro.
 * 2. Execute-o UMA ÚNICA VEZ no seu terminal com: node scripts/fixDatabaseIndex.js
 * =================================================================
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndex() {
    console.log('A ligar-se ao MongoDB Atlas para corrigir o índice...');
    
    if (!process.env.DB_URI) {
        console.error('ERRO: A variável DB_URI não foi encontrada no seu ficheiro .env');
        return;
    }

    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Ligado com sucesso à base de dados.');

        const devicesCollection = mongoose.connection.collection('devices');
        
        console.log("A tentar remover o índice 'deviceId_1'...");
        await devicesCollection.dropIndex('deviceId_1');
        
        console.log("SUCESSO! O índice problemático foi removido.");

    } catch (error) {
        if (error.codeName === 'IndexNotFound') {
            console.log("AVISO: O índice 'deviceId_1' já não existia. Não é necessária nenhuma ação.");
        } else {
            console.error("--- ERRO AO TENTAR REMOVER O ÍNDICE ---");
            console.error("Isto pode acontecer se as suas credenciais no .env estiverem incorretas.");
            console.error(error);
        }
    } finally {
        await mongoose.disconnect();
        console.log('Desligado da base de dados.');
    }
}

fixIndex();
