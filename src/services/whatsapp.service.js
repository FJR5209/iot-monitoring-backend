/*
 * =================================================================
 * FICHEIRO A SUBSTITUIR/CRIAR: src/services/whatsapp.service.js
 * DESCRIÇÃO: O serviço agora recebe a chave do utilizador como parâmetro.
 * =================================================================
 */
import axios from 'axios';

export async function sendWhatsAppMessage(phone, text, userApiKey) {
    if (!userApiKey || !phone) {
        console.warn(`[WHATSAPP] Chave API do utilizador ou telefone em falta para o número ${phone}. A saltar envio.`);
        return;
    }
    const encodedText = encodeURIComponent(text);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedText}&apikey=${userApiKey}`;
    try {
        await axios.get(url);
        console.log(`[WHATSAPP] Mensagem enviada para: ${phone}`);
    } catch (error) {
        console.error(`[WHATSAPP] Falha ao enviar mensagem para ${phone}:`, error.message);
    }
}
