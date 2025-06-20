/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/services/email.service.js
 * DESCRIÇÃO: Corrigido o formato do remetente para o SendGrid.
 * =================================================================
 */
import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);

// Configuração do transporter SMTP (ajuste conforme seu provedor)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Função genérica para enviar e-mails usando Nodemailer.
 * @param {object} options - Opções do e-mail.
 * @param {string} options.to - O e-mail do destinatário.
 * @param {string} options.subject - O assunto do e-mail.
 * @param {string} options.html - O corpo do e-mail em formato HTML.
 * @param {Array} [options.attachments] - Anexos (opcional)
 */
export async function sendEmail(options) {
    const mailOptions = {
        from: {
            name: 'Sistema de Monitorização IoT',
            address: process.env.SMTP_FROM
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || []
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`[E-MAIL] Mensagem enviada para: ${options.to} via Nodemailer.`);
    } catch (error) {
        console.error('[E-MAIL] Falha ao enviar via Nodemailer:', error);
    }
}

/**
 * Envia um e-mail de alerta de temperatura.
 */
export async function sendAlertEmail(to, deviceName, temperature, limit, type) {
    const subject = `Alerta de Temperatura: ${deviceName}`;
    const htmlBody = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d9534f;">Alerta de Emergência de Temperatura</h2>
            <p>O dispositivo <strong>${deviceName}</strong> registou uma temperatura fora dos limites definidos.</p>
            <ul>
                <li>Temperatura Registada: <strong>${temperature.toFixed(2)}°C</strong></li>
                <li>Limite de Temperatura ${type}: <strong>${limit.toFixed(2)}°C</strong></li>
            </ul>
            <p>Por favor, tome as medidas necessárias.</p>
        </div>
    `;

    await sendEmail({
        to,
        subject,
        html: htmlBody,
    });
}

/**
 * Envia um e-mail de recuperação de senha.
 * @param {string} to - O e-mail do destinatário.
 * @param {string} resetURL - O URL para onde o utilizador será redirecionado.
 */
export async function sendPasswordResetEmail(to, resetURL) {
    const subject = 'Recuperação de Senha (Válido por 10 min)';
    const htmlBody = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
            <h2 style="color: #333;">Esqueceu a sua senha?</h2>
            <p style="color: #555;">Recebemos um pedido para redefinir a senha da sua conta. Se não foi você, pode ignorar este e-mail.</p>
            <p style="color: #555;">Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetURL}" style="background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Redefinir Senha
            </a>
            <p style="font-size: 0.9em; color: #777; margin-top: 20px;">O link é válido por 10 minutos.</p>
        </div>
    `;

    await sendEmail({
        to,
        subject,
        html: htmlBody,
    });
}
