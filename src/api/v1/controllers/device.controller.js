/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/controllers/device.controller.js
 * DESCRIÇÃO: Corrigido o erro de chave duplicada ao criar um novo dispositivo.
 * =================================================================
 */
const Device = require('../../../models/Device'); 
const User = require('../../../models/User');     
const mongoose = require('mongoose');

// @desc    Registar um novo dispositivo
// @route   POST /api/v1/devices
// @access  Private (Admin)
const createDevice = async (req, res) => {
    const { name, tempMin, tempMax } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome do dispositivo é obrigatório.' });
    }

    try {
        const deviceData = {
            name,
            tenant: req.user.tenant,
            // CORREÇÃO: Adicionamos um deviceId único no momento da criação.
            // Usamos mongoose.Types.ObjectId() para gerar um ID único padrão.
            deviceId: new mongoose.Types.ObjectId(), 
            settings: {
                tempMin: parseFloat(tempMin),
                tempMax: parseFloat(tempMax),
            }
        };

        const device = await Device.create(deviceData);
        
        const fullDevice = await Device.findById(device._id).select('+deviceKey');
        res.status(201).json(fullDevice);

    } catch (error) {
        console.error('--- ERRO DETALHADO AO CRIAR DISPOSITIVO ---');
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor ao criar o dispositivo. Verifique os logs do backend.' });
    }
};

// @desc    Atualizar um dispositivo
// @route   PUT /api/v1/devices/:id
// @access  Private (Admin)
const updateDevice = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID do dispositivo inválido.' });
        }
        const device = await Device.findOne({ _id: req.params.id, tenant: req.user.tenant });
        if (!device) {
            return res.status(404).json({ message: 'Dispositivo não encontrado.' });
        }
        
        const { name, tempMin, tempMax } = req.body;
        device.name = name || device.name;
        
        if (tempMin !== undefined) {
            device.settings.tempMin = parseFloat(tempMin);
        }
        if (tempMax !== undefined) {
            device.settings.tempMax = parseFloat(tempMax);
        }

        const updatedDevice = await device.save();
        res.status(200).json(updatedDevice);
    } catch (error) {
        console.error('Erro ao atualizar dispositivo:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar o dispositivo.' });
    }
};


// --- O resto das funções do CRUD (sem alterações) ---

const getAllDevices = async (req, res) => {
    try {
        let devices;
        if (req.user.role === 'admin') {
            devices = await Device.find({ tenant: req.user.tenant });
        } else {
            const userWithDevices = await User.findById(req.user._id).populate('devices');
            devices = userWithDevices.devices;
        }
        res.status(200).json(devices);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao listar os dispositivos.' });
    }
};

const getDeviceById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
        const device = await Device.findOne({ _id: req.params.id, tenant: req.user.tenant }).select('+deviceKey');
        if (!device) return res.status(404).json({ message: 'Dispositivo não encontrado.' });
        res.status(200).json(device);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

const deleteDevice = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
        const device = await Device.findOne({ _id: req.params.id, tenant: req.user.tenant });
        if (!device) return res.status(404).json({ message: 'Dispositivo não encontrado.' });
        await device.deleteOne();
        res.status(200).json({ message: 'Dispositivo removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

module.exports = { createDevice, getAllDevices, getDeviceById, updateDevice, deleteDevice };
