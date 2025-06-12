/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/controllers/data.controller.js
 * DESCRIÇÃO: A lógica de alerta agora notifica todos os utilizadores
 * vinculados ao dispositivo (admins e viewers específicos).
 * =================================================================
 */
const Device = require('../../../models/Device');
const DataReading = require('../../../models/DataReading');
const User = require('../../../models/User');
const { sendAlertEmail } = require('../../../services/email.service');
const { sendWhatsAppMessage } = require('../../../services/whatsapp.service');

const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutos em milissegundos

const ingestData = async (req, res) => {
    const { deviceKey, temperature } = req.body;

    

    if (!deviceKey || temperature === undefined) {
        return res.status(400).json({ message: 'deviceKey e temperatura são obrigatórios.' });
    }

    try {
        const device = await Device.findOne({ deviceKey });
        if (!device) return res.status(404).json({ message: 'Dispositivo não registado.' });

        await DataReading.create({
            device: device._id,
            tenant: device.tenant,
            temperature,
        });
        
        let statusChanged = false;
        const tempMin = device.settings.tempMin;
        const tempMax = device.settings.tempMax;
        
        if (temperature > tempMax || temperature < tempMin) {
            device.status = 'alert';
            statusChanged = true;

            const now = new Date();
            if (!device.lastAlertSent || (now.getTime() - device.lastAlertSent.getTime() > ALERT_COOLDOWN)) {
                
                // --- LÓGICA DE NOTIFICAÇÃO ATUALIZADA ---
                console.log(`[ALERTA] Condição de alerta para o dispositivo ${device.name}. A procurar utilizadores vinculados...`);
                
                // Procura todos os utilizadores que devem ser notificados:
                // 1. Admins do tenant.
                // 2. Viewers que tenham este dispositivo na sua lista de 'devices'.
                const usersToAlert = await User.find({
                    tenant: device.tenant,
                    $or: [
                        { role: 'admin' },
                        { devices: device._id }
                    ]
                });

                console.log(`> ${usersToAlert.length} utilizador(es) encontrado(s) para notificação.`);

                for (const user of usersToAlert) {
                    const alertType = temperature > tempMax ? 'Máxima' : 'Mínima';
                    const limit = temperature > tempMax ? tempMax : tempMin;
                    sendAlertEmail(user.email, device.name, temperature, limit, alertType);
                }
                
                device.lastAlertSent = now;
            } else {
                console.log(`[ALERTA] Condição de alerta para ${device.name}, mas está em período de cooldown.`);
            }
        } else if (device.status === 'alert') {
            device.status = 'active';
            statusChanged = true;
        }

        device.lastContact = new Date();
        if(statusChanged || device.isModified('lastContact')) {
            await device.save();
        }

        res.status(201).json({ message: "Dados recebidos com sucesso!" });

    } catch (error) {
        console.error("Erro ao processar dados: ", error);
        res.status(500).json({ message: "Erro interno ao processar os dados." });
    }
};

module.exports = { ingestData };
