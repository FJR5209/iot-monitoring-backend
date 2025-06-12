/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/controllers/device.controller.js
 * DESCRIÇÃO: Funções de criar e atualizar agora incluem os campos de temperatura.
 * =================================================================
 */
const Device = require('../../../models/Device');
const User = require('../../../models/User');
const mongoose = require('mongoose');

// @desc    Registar um novo dispositivo
// @route   POST /api/v1/devices
// @access  Private (Admin)
const createDevice = async (req, res) => {
    // ATUALIZAÇÃO: Receber tempMin e tempMax do corpo do pedido
    const { name, tempMin, tempMax } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'O nome do dispositivo é obrigatório.' });
    }
    try {
        const device = await Device.create({
            name,
            tenant: req.user.tenant,
            'settings.tempMin': tempMin, // Guardar a temperatura mínima
            'settings.tempMax': tempMax, // Guardar a temperatura máxima
        });
        const fullDevice = await Device.findById(device._id).select('+deviceKey');
        res.status(201).json(fullDevice);
    } catch (error) {
        console.error('Erro ao criar dispositivo:', error);
        res.status(500).json({ message: 'Erro no servidor ao criar o dispositivo.' });
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
        
        // ATUALIZAÇÃO: Receber tempMin e tempMax para atualizar
        const { name, tempMin, tempMax } = req.body;
        device.name = name || device.name;
        device.settings.tempMin = tempMin ?? device.settings.tempMin; // Usar ?? para aceitar 0
        device.settings.tempMax = tempMax ?? device.settings.tempMax;

        const updatedDevice = await device.save();
        res.status(200).json(updatedDevice);
    } catch (error) {
        console.error('Erro ao atualizar dispositivo:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar o dispositivo.' });
    }
};


// --- O resto das funções do CRUD continuam iguais ---

// @desc    Listar todos os dispositivos do tenant
// @route   GET /api/v1/devices
// @access  Private
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

// @desc    Obter um dispositivo específico por ID
// @route   GET /api/v1/devices/:id
// @access  Private
const getDeviceById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID inválido.' });
        const device = await Device.findOne({ _id: req.params.id, tenant: req.user.tenant });
        if (!device) return res.status(404).json({ message: 'Dispositivo não encontrado.' });
        res.status(200).json(device);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// @desc    Apagar um dispositivo
// @route   DELETE /api/v1/devices/:id
// @access  Private
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

module.exports = {
    createDevice,
    getAllDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
};
