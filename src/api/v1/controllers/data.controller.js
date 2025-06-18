/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/controllers/data.controller.js
 * DESCRIÇÃO: A lógica de alerta agora notifica todos os utilizadores
 * vinculados ao dispositivo (admins e viewers específicos).
 * =================================================================
 */
import Device from '../../../models/Device.js';
import DataReading from '../../../models/DataReading.js';
import User from '../../../models/User.js';
import { sendAlertEmail } from '../../../services/email.service.js';
import { sendWhatsAppMessage } from '../../../services/whatsapp.service.js';
import mongoose from 'mongoose';

const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutos em milissegundos

// @desc    Ingestão de dados do dispositivo
// @route   POST /api/v1/data
// @access  Public
export const ingestData = async (req, res) => {
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

// @desc    Obter leituras de um dispositivo específico
// @route   GET /api/v1/devices/:id/readings
// @access  Private
export const getDeviceReadings = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, limit = 100 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID do dispositivo inválido.' });
        }

        // Verifica se o usuário tem acesso ao dispositivo
        const device = await Device.findOne({ _id: id, tenant: req.user.tenant });
        if (!device) {
            return res.status(404).json({ message: 'Dispositivo não encontrado ou sem permissão de acesso.' });
        }

        // Se o usuário for viewer, verifica se tem acesso ao dispositivo
        if (req.user.role === 'viewer' && !req.user.devices.includes(id)) {
            return res.status(403).json({ message: 'Sem permissão para acessar este dispositivo.' });
        }

        // Construir query
        const query = { device: id, tenant: req.user.tenant };
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Buscar leituras
        const readings = await DataReading.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .select('temperature timestamp -_id');

        res.status(200).json(readings);
    } catch (error) {
        console.error("Erro ao buscar leituras:", error);
        res.status(500).json({ message: "Erro interno ao buscar leituras." });
    }
};

// @desc    Obter últimas leituras de todos os dispositivos do tenant
// @route   GET /api/v1/data/latest
// @access  Private
export const getLatestReadings = async (req, res) => {
    try {
        // Buscar todos os dispositivos do tenant
        const devices = await Device.find({ tenant: req.user.tenant });
        
        // Se o usuário for viewer, filtrar apenas os dispositivos que ele tem acesso
        const deviceIds = req.user.role === 'viewer' 
            ? req.user.devices 
            : devices.map(d => d._id);

        // Buscar última leitura de cada dispositivo
        const latestReadings = await DataReading.aggregate([
            {
                $match: {
                    device: { $in: deviceIds },
                    tenant: req.user.tenant
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: "$device",
                    temperature: { $first: "$temperature" },
                    timestamp: { $first: "$timestamp" }
                }
            },
            {
                $lookup: {
                    from: "devices",
                    localField: "_id",
                    foreignField: "_id",
                    as: "deviceInfo"
                }
            },
            {
                $unwind: "$deviceInfo"
            },
            {
                $project: {
                    _id: 0,
                    deviceId: "$_id",
                    deviceName: "$deviceInfo.name",
                    temperature: 1,
                    timestamp: 1,
                    status: "$deviceInfo.status"
                }
            }
        ]);

        res.status(200).json(latestReadings);
    } catch (error) {
        console.error("Erro ao buscar últimas leituras:", error);
        res.status(500).json({ message: "Erro interno ao buscar últimas leituras." });
    }
};
