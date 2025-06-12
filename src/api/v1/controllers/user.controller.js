/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/controllers/user.controller.js
 * DESCRIÇÃO: Funções de gestão de perfil e utilizadores atualizadas.
 * =================================================================
 */
const User = require('../../../models/User');
const Device = require('../../../models/Device');
const { sendWhatsAppMessage } = require('../../../services/whatsapp.service');

const getMyProfile = async (req, res) => { const user = await User.findById(req.user.id); res.status(200).json(user); };

const updateMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { name, email, phoneNumber, whatsappApiKey } = req.body;
        
        user.name = name || user.name;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.whatsappApiKey = whatsappApiKey || user.whatsappApiKey;

        await user.save({ validateBeforeSave: false }); // Desativa validação para permitir campos parciais
        res.status(200).json(user);
    } catch (error) { res.status(500).json({ message: 'Erro ao atualizar o perfil.' }); }
};

const updateUser = async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acesso negado.' });
    try {
        const { name, email, role, devices, phoneNumber, whatsappApiKey } = req.body;
        const userToUpdate = await User.findById(req.params.id);

        if (!userToUpdate || userToUpdate.tenant.toString() !== req.user.tenant.toString()) return res.status(404).json({ message: 'Utilizador não encontrado.' });
        
        const oldDevices = new Set(userToUpdate.devices.map(d => d.toString()));
        
        userToUpdate.name = name || userToUpdate.name;
        userToUpdate.email = email || userToUpdate.email;
        userToUpdate.role = role || userToUpdate.role;
        userToUpdate.phoneNumber = phoneNumber || userToUpdate.phoneNumber;
        userToUpdate.whatsappApiKey = whatsappApiKey || userToUpdate.whatsappApiKey;

        if (role === 'viewer') {
            userToUpdate.devices = devices || [];
            const newDevices = new Set(devices || []);
            for (const newDeviceId of newDevices) {
                if (!oldDevices.has(newDeviceId)) {
                    const addedDevice = await Device.findById(newDeviceId);
                    if (addedDevice) {
                        const message = `Olá, ${userToUpdate.name}! O administrador vinculou o dispositivo "${addedDevice.name}" à sua conta.`;
                        sendWhatsAppMessage(userToUpdate.phoneNumber, message, userToUpdate.whatsappApiKey);
                    }
                }
            }
        } else { userToUpdate.devices = []; }
        
        const updatedUser = await userToUpdate.save();
        res.status(200).json(updatedUser);
    } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
};
// @desc    Listar todos os utilizadores do tenant
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        // ATUALIZAÇÃO: Agora o .populate() inclui os detalhes dos dispositivos vinculados a cada utilizador.
        // Isto é essencial para o frontend saber quais caixas de seleção marcar.
        const users = await User.find({ tenant: req.user.tenant }).populate('devices');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


const deleteUser = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const userToDelete = await User.findOne({ _id: req.params.id, tenant: req.user.tenant });

        if (!userToDelete) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        
        if (userToDelete._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Não pode apagar a sua própria conta de administrador.' });
        }

        await userToDelete.deleteOne();
        res.status(200).json({ message: 'Utilizador removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};


module.exports = {
    getAllUsers,
    updateUser,
    deleteUser
};
