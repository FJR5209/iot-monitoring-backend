/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/controllers/device.controller.js
 * DESCRIÇÃO: Versão completa e documentada do controlador de dispositivos,
 * agora com suporte para paginação e pesquisa, incluindo últimas leituras.
 * =================================================================
 */
import Device from '../../../models/Device.js';
import User from '../../../models/User.js';
import mongoose from 'mongoose';

// @desc    Listar dispositivos com paginação e pesquisa, incluindo últimas leituras
// @route   GET /api/v1/devices
// @access  Private
export const getAllDevices = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        let matchQuery = { tenant: req.user.tenant };

        // LÓGICA DE PERMISSÃO PARA VIEWERS
        // Se o utilizador não for um admin, filtramos para que ele só veja
        // os dispositivos que lhe foram atribuídos.
        if (req.user.role === 'viewer') {
            const userWithDevices = await User.findById(req.user._id).select('devices');
            matchQuery._id = { $in: userWithDevices.devices };
        }
        
        // LÓGICA DE PESQUISA
        // Se um termo de pesquisa for enviado, ele é combinado com os filtros de permissão.
        if (search) {
            matchQuery.name = { $regex: search, $options: 'i' }; // Pesquisa por nome, case-insensitive
        }

        // Pipeline de agregação para buscar dispositivos com últimas leituras
        const pipeline = [
            // Primeiro estágio: filtrar dispositivos
            { $match: matchQuery },
            
            // Segundo estágio: buscar a última leitura de cada dispositivo
            {
                $lookup: {
                    from: 'datareadings',
                    let: { deviceId: '$_id' },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { $eq: ['$device', '$$deviceId'] } 
                            } 
                        },
                        { $sort: { timestamp: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'lastReading'
                }
            },
            
            // Terceiro estágio: buscar as últimas 5 leituras de cada dispositivo
            {
                $lookup: {
                    from: 'datareadings',
                    let: { deviceId: '$_id' },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { $eq: ['$device', '$$deviceId'] } 
                            } 
                        },
                        { $sort: { timestamp: -1 } },
                        { $limit: 5 }
                    ],
                    as: 'readings'
                }
            },
            
            // Quarto estágio: formatar os dados
            {
                $addFields: {
                    lastReading: { $arrayElemAt: ['$lastReading', 0] },
                    readings: {
                        $map: {
                            input: '$readings',
                            as: 'reading',
                            in: {
                                temperature: '$$reading.temperature',
                                humidity: '$$reading.humidity',
                                timestamp: '$$reading.timestamp'
                            }
                        }
                    }
                }
            },
            
            // Quinto estágio: incluir deviceKey apenas para admins
            {
                $addFields: {
                    deviceKey: {
                        $cond: {
                            if: { $eq: [req.user.role, 'admin'] },
                            then: '$deviceKey',
                            else: '$$REMOVE'
                        }
                    }
                }
            },
            
            // Sexto estágio: ordenar por data de criação
            { $sort: { createdAt: -1 } }
        ];

        // Executa a agregação com paginação
        const devices = await Device.aggregate(pipeline)
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        // Conta o número total de documentos que correspondem à consulta (sem paginação)
        const countPipeline = [
            { $match: matchQuery },
            { $count: 'total' }
        ];
        const countResult = await Device.aggregate(countPipeline);
        const count = countResult.length > 0 ? countResult[0].total : 0;

        // Retorna os dados no novo formato paginado
        res.status(200).json({
            data: devices,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalItems: count
        });

    } catch (error) {
        console.error("Erro em getAllDevices:", error);
        res.status(500).json({ message: 'Erro no servidor ao listar os dispositivos.' });
    }
};

export const createDevice = async (req, res) => {
    const { name, tempMin, tempMax } = req.body;
    if (!name) return res.status(400).json({ message: 'O nome do dispositivo é obrigatório.' });
    try {
        const deviceData = { name, tenant: req.user.tenant, settings: { tempMin: parseFloat(tempMin), tempMax: parseFloat(tempMax) } };
        const device = await Device.create(deviceData);
        const fullDevice = await Device.findById(device._id).select('+deviceKey');
        res.status(201).json(fullDevice);
    } catch (error) { res.status(500).json({ message: 'Erro no servidor ao criar o dispositivo.' }); }
};

export const getDeviceById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }

        // Pipeline de agregação para buscar dispositivo específico com últimas leituras
        const pipeline = [
            // Primeiro estágio: filtrar dispositivo específico
            { 
                $match: { 
                    _id: new mongoose.Types.ObjectId(req.params.id),
                    tenant: req.user.tenant 
                } 
            },
            
            // Segundo estágio: buscar a última leitura
            {
                $lookup: {
                    from: 'datareadings',
                    let: { deviceId: '$_id' },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { $eq: ['$device', '$$deviceId'] } 
                            } 
                        },
                        { $sort: { timestamp: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'lastReading'
                }
            },
            
            // Terceiro estágio: buscar as últimas 5 leituras
            {
                $lookup: {
                    from: 'datareadings',
                    let: { deviceId: '$_id' },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { $eq: ['$device', '$$deviceId'] } 
                            } 
                        },
                        { $sort: { timestamp: -1 } },
                        { $limit: 5 }
                    ],
                    as: 'readings'
                }
            },
            
            // Quarto estágio: formatar os dados
            {
                $addFields: {
                    lastReading: { $arrayElemAt: ['$lastReading', 0] },
                    readings: {
                        $map: {
                            input: '$readings',
                            as: 'reading',
                            in: {
                                temperature: '$$reading.temperature',
                                humidity: '$$reading.humidity',
                                timestamp: '$$reading.timestamp'
                            }
                        }
                    }
                }
            },
            
            // Quinto estágio: incluir deviceKey para admins
            {
                $addFields: {
                    deviceKey: {
                        $cond: {
                            if: { $eq: [req.user.role, 'admin'] },
                            then: '$deviceKey',
                            else: '$$REMOVE'
                        }
                    }
                }
            }
        ];

        const devices = await Device.aggregate(pipeline);
        
        if (devices.length === 0) {
            return res.status(404).json({ message: 'Dispositivo não encontrado.' });
        }

        res.status(200).json(devices[0]);
    } catch (error) {
        console.error("Erro em getDeviceById:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

export const updateDevice = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
        const device = await Device.findOne({ _id: req.params.id, tenant: req.user.tenant });
        if (!device) return res.status(404).json({ message: 'Dispositivo não encontrado.' });
        
        const { name, tempMin, tempMax } = req.body;
        device.name = name || device.name;
        if (tempMin !== undefined) device.settings.tempMin = parseFloat(tempMin);
        if (tempMax !== undefined) device.settings.tempMax = parseFloat(tempMax);

        const updatedDevice = await device.save();
        res.status(200).json(updatedDevice);
    } catch (error) { res.status(500).json({ message: 'Erro no servidor ao atualizar o dispositivo.' }); }
};

export const deleteDevice = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
        const device = await Device.findOne({ _id: req.params.id, tenant: req.user.tenant });
        if (!device) return res.status(404).json({ message: 'Dispositivo não encontrado.' });
        await device.deleteOne();
        res.status(200).json({ message: 'Dispositivo removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: "Erro ao remover dispositivo.", error: error.message });
    }
};

// @desc    Registrar heartbeat de um dispositivo
// @route   POST /api/v1/devices/:id/heartbeat
// @access  Public (autenticado por deviceKey)
export const deviceHeartbeat = async (req, res) => {
    try {
        const { id } = req.params;
        const deviceKey = req.headers['x-device-key'];

        if (!deviceKey) {
            return res.status(401).json({ message: 'Chave do dispositivo (x-device-key) não fornecida.' });
        }

        const device = await Device.findById(id).select('+deviceKey');
        if (!device) {
            return res.status(404).json({ message: 'Dispositivo não encontrado.' });
        }

        if (device.deviceKey !== deviceKey) {
            return res.status(403).json({ message: 'Chave do dispositivo inválida.' });
        }

        device.lastSeen = new Date();
        device.isOnline = true;
        await device.save();

        console.log(`[Heartbeat] Recebido para o dispositivo: ${device.name}`);
        res.status(200).json({ message: 'Heartbeat recebido com sucesso.' });
    } catch (error) {
        console.error('Erro no heartbeat:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

// @desc    Obter status de um dispositivo
// @route   GET /api/v1/devices/:id/status
// @access  Private
export const getDeviceStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID do dispositivo inválido.' });
        }

        // Garante que o usuário só possa ver dispositivos do seu tenant.
        const device = await Device.findOne({ _id: id, tenant: req.user.tenant });

        if (!device) {
            return res.status(404).json({ message: 'Dispositivo não encontrado ou não pertence à sua organização.' });
        }

        res.status(200).json({
            isOnline: device.isOnline,
            lastSeen: device.lastSeen,
            uptime: null // Placeholder para futura implementação
        });

    } catch (error) {
        console.error('Erro ao obter status do dispositivo:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};