/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/services/email.service.js
 * DESCRIÇÃO: Corrigido o formato do remetente para o SendGrid.
 * =================================================================
 */
// Usaremos a biblioteca oficial do SendGrid.
const sgMail = require('@sendgrid/mail');

// A chave de API é carregada de forma segura a partir das variáveis de ambiente.
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Função genérica para enviar e-mails usando o SendGrid.
 * @param {object} options - Opções do e-mail.
 * @param {string} options.to - O e-mail do destinatário.
 * @param {string} options.subject - O assunto do e-mail.
 * @param {string} options.html - O corpo do e-mail em formato HTML.
 */
async function sendEmail(options) {
    const msg = {
        to: options.to,
        // CORREÇÃO: O campo 'from' agora é um objeto com a propriedade 'email', como exigido.
        from: {
            email: process.env.SENDGRID_VERIFIED_EMAIL,
            name: 'Sistema de Monitorização IoT' // Nome opcional, mas recomendado
        },
        subject: options.subject,
        html: options.html,
    };

    try {
        await sgMail.send(msg);
        console.log(`[E-MAIL] Mensagem enviada para: ${options.to} via SendGrid.`);
    } catch (error) {
        console.error('[E-MAIL] Falha ao enviar via SendGrid:', error);
        if (error.response) {
            console.error(error.response.body);
        }
    }
}

/**
 * Envia um e-mail de alerta de temperatura.
 */
async function sendAlertEmail(to, deviceName, temperature, limit, type) {
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
async function sendPasswordResetEmail(to, resetURL) {
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

module.exports = {
    sendEmail,
    sendAlertEmail,
    sendPasswordResetEmail,
};
