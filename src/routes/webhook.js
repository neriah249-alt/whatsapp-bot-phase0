const express = require('express');
const router = express.Router();
const { verifyWebhookSignature } = require('../middleware/verifyWebhook');
const { getContext, saveMessage, isOptedOut, setOptOut } = require('../services/redis');
const { generateResponse, getFallbackResponse } = require('../services/groq');
const { sendWhatsAppMessage } = require('../services/meta');
const { saveConversation } = require('../services/supabase');
const { buildSystemPrompt } = require('../utils/prompt');
const config = require('../config');

/**
 * GET /webhook - Verification par Meta (challenge)
 */
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mon_bot_whatsapp_2026';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verifie par Meta');
        res.status(200).send(challenge);
    } else {
        console.warn('Verification webhook echouee');
        res.sendStatus(403);
    }
});

/**
 * POST /webhook - Reception des messages entrants
 */
router.post('/', verifyWebhookSignature, async(req, res) => {
    const startTime = Date.now();

    try {
        // Repondre immediatement a Meta (timeout 20s)
        res.status(200).send('OK');

        const entry = req.body.entry ? .[0];
        const changes = entry ? .changes ? .[0];
        const value = changes ? .value;

        if (value ? .messages ? .[0]) {
            const message = value.messages[0];
            const from = message.from;
            const msgBody = message.text ? .body || '';

            console.log(`Message recu de ${from}: "${msgBody.substring(0, 100)}..."`);

            // Verifier opt-out
            if (await isOptedOut(from)) {
                console.log(`${from} est desinscrit, ignore.`);
                return;
            }

            // Verifier commande STOP
            if (msgBody.toLowerCase().includes('stop') ||
                msgBody.toLowerCase().includes('arrete') ||
                msgBody.toLowerCase().includes('desinscription')) {
                await setOptOut(from);
                await sendWhatsAppMessage(from, "Vous avez ete desinscrit. Vous ne recevrez plus de messages. Pour reactiver, envoyez START.");
                return;
            }

            // Verifier transfert humain
            const lowerMsg = msgBody.toLowerCase();
            const needsHuman = config.bot.humanTransferKeywords.some(keyword =>
                lowerMsg.includes(keyword.toLowerCase())
            );

            if (needsHuman) {
                const transferMsg = "Je vous transfere a un agent humain. Vous serez contacte sous peu.";
                await sendWhatsAppMessage(from, transferMsg);
                await saveMessage(from, 'user', msgBody);
                await saveMessage(from, 'assistant', transferMsg);
                await saveConversation({
                    phoneNumber: from,
                    messageIn: msgBody,
                    messageOut: transferMsg,
                    intent: 'human_transfer',
                    responseTime: Date.now() - startTime
                });
                return;
            }

            // Recuperer contexte (5 derniers messages)
            const contextMessages = await getContext(from, config.bot.maxContextMessages);

            // Construire les messages pour Groq
            const messages = [
                { role: 'system', content: buildSystemPrompt() },
                ...contextMessages.map(msg => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: msgBody }
            ];

            // Generer reponse IA
            let aiResponse;
            try {
                const groqResult = await generateResponse(messages);
                aiResponse = groqResult.content;
                //Redis: Contexte pour la prochaine conversation
                await saveMessage(from, 'user', msgBody);
                await saveMessage(from, 'assistant', aiResponse);
                //Supabase: historique permanent
                await saveConversation({
                    phoneNumber: from,
                    messageIn: msgBody,
                    messageOut: aiResponse,
                    intent: 'auto_response',
                    responseTime: groqResult.responseTime,
                    modelUsed: groqResult.model
                });

            } catch (error) {
                console.warn('Fallback active - Groq indisponible');
                aiResponse = getFallbackResponse(msgBody);

                await sendWhatsAppMessage(from, aiResponse);
                await saveConversation({
                    phoneNumber: from,
                    messageIn: msgBody,
                    messageOut: aiResponse,
                    intent: 'fallback',
                    responseTime: Date.now() - startTime
                });
                return;
            }

            // Envoyer reponse au client
            await sendWhatsAppMessage(from, aiResponse);

            const totalTime = Date.now() - startTime;
            console.log(`Conversation traitee en ${totalTime}ms`);
        }

    } catch (error) {
        console.error('Erreur traitement webhook:', error);
    }
});

module.exports = router;