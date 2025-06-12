/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/controllers/dashboard.controller.js
 * DESCRIÇÃO: Corrigido o caminho para os modelos.
 * =================================================================
 */
const mongoose = require('mongoose');
const DataReading = require('../../../models/DataReading');
const Device = require('../../../models/Device');

const getDeviceData = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate } = req.query;
        const userTenantId = req.user.tenant;

        if (!mongoose.Types.ObjectId.isValid(deviceId)) {
            return res.status(400).json({ message: 'ID do dispositivo inválido.' });
        }

        const device = await Device.findOne({ _id: deviceId, tenant: userTenantId });
        if (!device) {
            return res.status(404).json({ message: 'Dispositivo não encontrado ou não pertence à sua organização.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const stats = await DataReading.aggregate([
            { $match: { device: new mongoose.Types.ObjectId(deviceId), tenant: userTenantId, timestamp: { $gte: start, $lte: end } } },
            { $group: { _id: null, maxTemp: { $max: '$temperature' }, minTemp: { $min: '$temperature' }, avgTemp: { $avg: '$temperature' } } },
            { $project: { _id: 0, maxTemp: { $round: ['$maxTemp', 2] }, minTemp: { $round: ['$minTemp', 2] }, avgTemp: { $round: ['$avgTemp', 2] } } }
        ]);
        
        const chartData = await DataReading.find({
            device: deviceId, tenant: userTenantId, timestamp: { $gte: start, $lte: end }
        }).sort({ timestamp: 'asc' }).select('temperature timestamp -_id');

        res.status(200).json({
            stats: stats.length > 0 ? stats[0] : { maxTemp: null, minTemp: null, avgTemp: null },
            chartData
        });
    } catch (error) {
        console.error("Erro ao buscar dados para o dashboard: ", error);
        res.status(500).json({ message: "Erro interno ao processar a solicitação." });
    }
};

module.exports = {
    getDeviceData,
};
