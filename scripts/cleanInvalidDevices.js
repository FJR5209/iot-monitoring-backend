/*
 * =================================================================
 * FICHEIRO A CRIAR: scripts/cleanInvalidDevices.js
 * DESCRIÇÃO: Script para remover dispositivos inválidos da base de dados.
 * =================================================================
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Device from '../src/models/Device.js';
import DataReading from '../src/models/DataReading.js';

dotenv.config();

async function cleanInvalidDevices() {
    console.log('🧹 A limpar dispositivos inválidos...');
    
    if (!process.env.DB_URI) {
        console.error('❌ ERRO: A variável DB_URI não foi encontrada no seu ficheiro .env');
        return;
    }

    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('✅ Ligado com sucesso à base de dados.');

        // Encontrar dispositivos inválidos
        const invalidDevices = await Device.find({
            $or: [
                { name: { $exists: false } },
                { name: null },
                { name: '' },
                { name: 'undefined' },
                { tenant: { $exists: false } },
                { tenant: null }
            ]
        });

        console.log(`📱 Encontrados ${invalidDevices.length} dispositivo(s) inválido(s).`);

        if (invalidDevices.length === 0) {
            console.log('✅ Nenhum dispositivo inválido encontrado.');
            return;
        }

        // Mostrar dispositivos que serão removidos
        console.log('\n🗑️  Dispositivos que serão removidos:');
        for (const device of invalidDevices) {
            console.log(`   - ID: ${device._id}`);
            console.log(`     Nome: "${device.name}"`);
            console.log(`     Tenant: ${device.tenant}`);
            console.log(`     Criado em: ${device.createdAt}`);
            
            // Contar leituras associadas
            const readingsCount = await DataReading.countDocuments({ device: device._id });
            console.log(`     Leituras associadas: ${readingsCount}`);
        }

        // Confirmar remoção
        console.log('\n⚠️  ATENÇÃO: Esta operação irá remover permanentemente os dispositivos inválidos e todas as suas leituras.');
        console.log('   Para continuar, edite este script e descomente a linha de remoção.');

        // DESCOMENTE A LINHA ABAIXO PARA EXECUTAR A REMOÇÃO
        await Device.deleteMany({ _id: { $in: invalidDevices.map(d => d._id) } });
        await DataReading.deleteMany({ device: { $in: invalidDevices.map(d => d._id) } });
        
        console.log('   ✅ Dispositivos inválidos removidos com sucesso!');

    } catch (error) {
        console.error('❌ ERRO:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desligado da base de dados.');
    }
}

// Executar o script
cleanInvalidDevices(); 