/*
 * =================================================================
 * FICHEIRO: src/api/v1/controllers/auth.controller.js
 * DESCRIÇÃO: Ficheiro completo com todas as funções de autenticação.
 * =================================================================
 */
import User from '../../../models/User.js';
import Tenant from '../../../models/Tenant.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../../services/email.service.js';

// Função auxiliar para gerar um token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Registar um novo utilizador
export const register = async (req, res) => {
    const { tenantName, name, email, password, role, phoneNumber, whatsappApiKey } = req.body;
    if (!tenantName || !name || !email || !password) {
        return res.status(400).json({ message: 'Nome da empresa, nome do utilizador, e-mail e senha são obrigatórios.' });
    }
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        let tenant = await Tenant.findOne({ name: tenantName });
        if (!tenant) tenant = await Tenant.create({ name: tenantName });
        const user = await User.create({ tenant: tenant._id, name, email, password, role, phoneNumber, whatsappApiKey });
        if (user) {
            res.status(201).json({ _id: user._id, email: user.email, token: generateToken(user._id) });
        } else {
            res.status(400).json({ message: 'Dados de utilizador inválidos.' });
        }
    } catch (error) { res.status(500).json({ message: 'Erro no servidor ao tentar registar.' }); }
};

// @desc    Autenticar um utilizador
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Por favor, forneça e-mail e senha.' });
    try {
        const user = await User.findOne({ email }).select('+password').populate('tenant', 'name');
        if (user && (await user.comparePassword(password))) {
            res.json({ _id: user._id, email: user.email, role: user.role, tenant: user.tenant.name, token: generateToken(user._id) });
        } else {
            res.status(401).json({ message: 'E-mail ou senha inválidos.' });
        }
    } catch (error) { res.status(500).json({ message: 'Erro no servidor ao tentar fazer login.' }); }
};

// @desc    Esqueci a minha senha
export const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        // ATUALIZAÇÃO: Verifica se o utilizador existe.
        if (!user) {
            // Se não existir, retorna um erro 404 (Not Found) com a mensagem específica.
            return res.status(404).json({ message: 'Nenhum utilizador encontrado com este e-mail. Por favor, informe um e-mail válido.' });
        }
        
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const resetURL = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
        const subject = 'Recuperação de Senha (Válido por 10 min)';
        const htmlBody = `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>Esqueceu a sua senha?</h2>
                <p>Recebemos um pedido para redefinir a senha da sua conta. Clique no link abaixo:</p>
                <a href="${resetURL}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
            </div>`;
        
        try {
            await sendEmail({ to: user.email, subject, html: htmlBody });
            // Se o e-mail for enviado com sucesso, retorna a mensagem de sucesso.
            res.status(200).json({ message: 'E-mail enviado com sucesso!' });
        } catch (err) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Houve um erro ao enviar o e-mail.' });
        }
    } catch (error) { res.status(500).json({ message: 'Erro no servidor' }); }
};

// @desc    Redefinir a senha
export const resetPassword = async (req, res) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    try {
        const user = await User.findOne({ 
            passwordResetToken: hashedToken, 
            passwordResetExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ message: 'Token é inválido ou expirou.' });
        }

        if (!req.body.password || req.body.password.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });

    } catch (error) {
        console.error('--- ERRO AO REDEFINIR A SENHA ---');
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor ao redefinir a senha.' });
    }
};

