/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/controllers/user.controller.js
 * DESCRIÇÃO: Ficheiro completo com todas as funções de gestão de utilizadores.
 * =================================================================
 */
import User from '../../../models/User.js';
import Device from '../../../models/Device.js';
import { sendWhatsAppMessage } from '../../../services/whatsapp.service.js';

// @desc    Admin lista todos os utilizadores do tenant
// @route   GET /api/v1/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const users = await User.find({ tenant: req.user.tenant }).populate('devices', 'name');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// @desc    Admin obtém um utilizador específico por ID
// @route   GET /api/v1/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const user = await User.findOne({ _id: req.params.id, tenant: req.user.tenant })
            .populate('devices', 'name');
        
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// @desc    Utilizador obtém o seu próprio perfil
// @route   GET /api/v1/users/me
// @access  Private
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao obter o perfil.' });
    }
};

// @desc    Utilizador atualiza o seu próprio perfil
// @route   PUT /api/v1/users/me
// @access  Private
const updateMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { name, email, phoneNumber, whatsappApiKey } = req.body;
        
        user.name = name !== undefined ? name : user.name;
        user.email = email !== undefined ? email : user.email;
        user.phoneNumber = phoneNumber !== undefined ? phoneNumber : user.phoneNumber;
        user.whatsappApiKey = whatsappApiKey !== undefined ? whatsappApiKey : user.whatsappApiKey;

        await user.save({ validateBeforeSave: false });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
    }
};

// @desc    Admin atualiza um utilizador
// @route   PUT /api/v1/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const { name, email, role, devices, phoneNumber, whatsappApiKey } = req.body;
        const userToUpdate = await User.findById(req.params.id);

        if (!userToUpdate || userToUpdate.tenant.toString() !== req.user.tenant.toString()) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        
        const oldDevices = new Set(userToUpdate.devices.map(d => d.toString()));

        userToUpdate.name = name || userToUpdate.name;
        userToUpdate.email = email || userToUpdate.email;
        userToUpdate.role = role || userToUpdate.role;
        userToUpdate.phoneNumber = phoneNumber || userToUpdate.phoneNumber;
        userToUpdate.whatsappApiKey = whatsappApiKey || userToUpdate.whatsappApiKey;

        if (devices !== undefined) {
            if (userToUpdate.role === 'viewer') {
                userToUpdate.devices = devices;

                const newDevicesSet = new Set(devices || []);
                for (const newDeviceId of newDevicesSet) {
                    if (!oldDevices.has(newDeviceId)) {
                        const addedDevice = await Device.findById(newDeviceId);
                        if (addedDevice && userToUpdate.phoneNumber && userToUpdate.whatsappApiKey) {
                            const message = `Olá, ${userToUpdate.name}! O dispositivo "${addedDevice.name}" foi vinculado à sua conta.`;
                            sendWhatsAppMessage(userToUpdate.phoneNumber, message, userToUpdate.whatsappApiKey);
                        }
                    }
                }
            }
        }
        
        if (role === 'admin') {
            userToUpdate.devices = [];
        }

        const updatedUser = await userToUpdate.save();
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Erro ao atualizar utilizador:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// @desc    Admin apaga um utilizador
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin)
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

export {
    getAllUsers,
    getMyProfile,
    updateMyProfile,
    updateUser,
    deleteUser,
    getUserById
};