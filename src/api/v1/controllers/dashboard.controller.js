/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/controllers/dashboard.controller.js
 * DESCRIÇÃO: Corrigido o caminho para os modelos.
 * =================================================================
 */
import mongoose from 'mongoose';
import DataReading from '../../../models/DataReading.js';
import Device from '../../../models/Device.js';

export const getDeviceData = async (req, res) => {
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

function renderChart(canvas, chartData) {
    console.log('[renderChart] Iniciando renderização do gráfico');
    console.log('[renderChart] Dados recebidos:', chartData);
    
    // Destruir instância anterior se existir
    if (chartInstance) {
        console.log('[renderChart] Destruindo instância anterior do gráfico');
        chartInstance.destroy();
    }
    
    if (!canvas) {
        console.error('[renderChart] Canvas não encontrado');
        return;
    }
    
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
        console.error('[renderChart] Dados inválidos para o gráfico:', chartData);
        return;
    }
    
    console.log('[renderChart] Preparando dados do gráfico');
    const recentData = chartData.slice(-10);
    console.log('[renderChart] Dados recentes:', recentData);
    
    const labels = recentData.map(d => {
        const date = new Date(d.timestamp);
        console.log('[renderChart] Processando timestamp:', d.timestamp, '->', date);
        return date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    });
    
    console.log('[renderChart] Labels gerados:', labels);
    console.log('[renderChart] Configurando opções do Chart.js');
    
    Chart.defaults.color = '#94a3b8';
    
    try {
        console.log('[renderChart] Criando nova instância do gráfico');
        chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Temperatura',
                    data: recentData.map(d => d.temperature),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperatura (°C)',
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(100, 116, 139, 0.2)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(100, 116, 139, 0.2)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
        
        console.log('[renderChart] Gráfico renderizado com sucesso');
        return chartInstance;
    } catch (error) {
        console.error('[renderChart] Erro ao criar gráfico:', error);
        throw error;
    }
}
