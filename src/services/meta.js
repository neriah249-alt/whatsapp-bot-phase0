const axios = require('axios');
const config = require('../config');

const META_API_URL = `https://graph.facebook.com/${config.meta.apiVersion}`;

/**
 * Envoie un message WhatsApp via l'API Meta Sandbox
 * @param {string} to - Numero du destinataire (format international)
 * @param {string} message - Contenu du message
 */
async function sendWhatsAppMessage(to, message) {
  try {
    const url = `${META_API_URL}/${config.meta.phoneNumberId}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.meta.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Message envoye a ${to} | Message ID: ${response.data.messages?.[0]?.id}`);
    return response.data;
  } catch (error) {
    console.error('Erreur envoi message Meta:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  sendWhatsAppMessage
};