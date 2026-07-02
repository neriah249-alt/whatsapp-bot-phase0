const crypto = require('crypto');
const axios = require('axios'); //bibliothèque http
require('dotenv').config();

const RAILWAY_URL = 'https://whatsapp-bot-phase0-production.up.railway.app/webhook';
const APP_SECRET = process.env.META_APP_SECRET;

const fakeMetaPayload = {
    object: 'whatsapp_business_account',
    entry: [{
        id: '123456789',
        changes: [{
            value: {
                messaging_product: 'whatsapp',
                metadata: {
                    display_phone_number: '15556492362',
                    phone_number_id: '1182938261572318'
                },
                messages: [{
                    from: '22912345678',
                    id: 'wamid.test123',
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: 'Bonjour, je voudrais des infos sur vos services' },
                    type: 'text'
                }]
            },
            field: 'messages'
        }]
    }]
};

function generateSignature(payload, secret) {
    const bodyString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(bodyString, 'utf8');
    return 'sha256=' + hmac.digest('hex');
}

async function testWebhook() {
    if (!APP_SECRET) {
        console.error('META_APP_SECRET manquant dans .env');
        return;
    }

    const signature = generateSignature(fakeMetaPayload, APP_SECRET);

    try {
        console.log('Envoi du message simule avec signature valide...');
        const response = await axios.post(RAILWAY_URL, fakeMetaPayload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Hub-Signature-256': signature
            }
        });
        console.log('Statut:', response.status);
        console.log('Reponse:', response.data);
        console.log('\nVerifie les logs Railway maintenant !');
    } catch (error) {
        if (error.response) {
            console.error('Erreur HTTP', error.response.status, ':', error.response.data);
        } else {
            console.error('Erreur:', error.message);
        }
    }
}

testWebhook();