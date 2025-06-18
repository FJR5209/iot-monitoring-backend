/*
 * =================================================================
 * FICHEIRO A CRIAR: scripts/checkAndInsertTestData.js
 * DESCRIÇÃO: Script para verificar leituras no banco e inserir dados de teste.
 * =================================================================
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataReading from '../src/models/DataReading.js';
import Device from '../src/models/Device.js';
import Tenant from '../src/models/Tenant.js';

dotenv.config();

async function checkAndInsertTestData() {
    console.log('🔍 A verificar dados na base de dados...');
    
    if (!process.env.DB_URI) {
        console.error('❌ ERRO: A variável DB_URI não foi encontrada no seu ficheiro .env');
        return;
    }

    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('✅ Ligado com sucesso à base de dados.');

        // 1. Verificar se existem tenants
        const tenants = await Tenant.find();
        console.log(`📊 Encontrados ${tenants.length} tenant(s) na base de dados.`);
        
        if (tenants.length === 0) {
            console.log('❌ Nenhum tenant encontrado. Crie um tenant primeiro.');
            return;
        }

        // 2. Verificar dispositivos válidos (com nome e tenant)
        const devices = await Device.find({ 
            name: { $exists: true, $ne: null, $ne: '' },
            tenant: { $exists: true, $ne: null }
        });
        console.log(`📱 Encontrados ${devices.length} dispositivo(s) válido(s) na base de dados.`);
        
        if (devices.length === 0) {
            console.log('❌ Nenhum dispositivo válido encontrado. Crie dispositivos primeiro.');
            return;
        }

        // 3. Verificar leituras para cada dispositivo
        for (const device of devices) {
            const readingsCount = await DataReading.countDocuments({ device: device._id });
            console.log(`📈 Dispositivo "${device.name}": ${readingsCount} leitura(s)`);
            
            if (readingsCount === 0) {
                console.log(`   ⚠️  Nenhuma leitura encontrada para "${device.name}". A inserir dados de teste...`);
                
                // Inserir 10 leituras de teste para este dispositivo
                const testReadings = [];
                const now = new Date();
                
                for (let i = 9; i >= 0; i--) {
                    const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000)); // 30 minutos atrás
                    const temperature = device.settings.tempMin + Math.random() * (device.settings.tempMax - device.settings.tempMin);
                    
                    testReadings.push({
                        device: device._id,
                        tenant: device.tenant,
                        temperature: parseFloat(temperature.toFixed(2)),
                        timestamp: timestamp
                    });
                }
                
                await DataReading.insertMany(testReadings);
                console.log(`   ✅ Inseridas ${testReadings.length} leituras de teste para "${device.name}".`);
            }
        }

        // 4. Mostrar resumo final
        console.log('\n📋 RESUMO FINAL:');
        for (const device of devices) {
            const readingsCount = await DataReading.countDocuments({ device: device._id });
            const latestReading = await DataReading.findOne({ device: device._id }).sort({ timestamp: -1 });
            
            console.log(`   📱 ${device.name}:`);
            console.log(`      - Total de leituras: ${readingsCount}`);
            if (latestReading) {
                console.log(`      - Última leitura: ${latestReading.temperature}°C (${latestReading.timestamp.toLocaleString()})`);
            }
        }

        // 5. Verificar dispositivos inválidos
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
        
        if (invalidDevices.length > 0) {
            console.log('\n⚠️  DISPOSITIVOS INVÁLIDOS ENCONTRADOS:');
            for (const device of invalidDevices) {
                console.log(`   - ID: ${device._id}`);
                console.log(`     Nome: "${device.name}"`);
                console.log(`     Tenant: ${device.tenant}`);
                console.log(`     Criado em: ${device.createdAt}`);
            }
            console.log('   💡 Considere remover estes dispositivos inválidos.');
        }

    } catch (error) {
        console.error('❌ ERRO:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desligado da base de dados.');
    }
}

// Executar o script
checkAndInsertTestData(); 