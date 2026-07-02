const express = require('express');
const webhookRoutes = require('./routes/webhook');
const { initDatabase } = require('./services/supabase');
const config = require('./config');

const app = express();

// Middleware
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// Routes
app.use('/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        phase: 'Phase 0 - Validation Gratuite',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Politique de confidentialite (requise par Meta)
app.get('/privacy', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"><title>Politique de Confidentialite</title></head>
        <body style="font-family:Arial;max-width:800px;margin:40px auto;padding:20px">
            <h1>Politique de Confidentialite - Bot WhatsApp IA Pro</h1>
            <p><strong>Derniere mise a jour :</strong> Juillet 2026</p>
            <h2>Donnees collectees</h2>
            <p>Ce service collecte uniquement les messages WhatsApp envoyes par les utilisateurs dans le cadre du traitement automatise des demandes clients.</p>
            <h2>Utilisation des donnees</h2>
            <p>Les donnees sont utilisees exclusivement pour generer des reponses automatiques via intelligence artificielle.</p>
            <h2>Stockage et securite</h2>
            <p>Les donnees sont stockees de facon securisee et chiffree. Elles ne sont jamais partagees avec des tiers.</p>
            <h2>Vos droits</h2>
            <p>Vous pouvez demander la suppression de vos donnees a tout moment en envoyant STOP dans la conversation.</p>
            <h2>Contact</h2>
            <p>Pour toute question : botwhatsapp@gmail.com</p>
        </body>
        </html>
    `);
});

// Page d'accueil
app.get('/', (req, res) => {
    res.json({
        message: 'Bot WhatsApp IA Pro - Phase 0',
        documentation: 'CDC v1.1 - Lean Startup',
        endpoints: {
            webhook: 'POST /webhook (reception messages Meta)',
            health: 'GET /health (statut serveur)',
            privacy: 'GET /privacy (politique de confidentialite)'
        }
    });
});

// Demarrage
async function start() {
    try {
        await initDatabase();
        console.log('Base de donnees initialisee');
    } catch (error) {
        console.warn('Supabase indisponible - le bot continue sans historique:', error.message);
    }

    app.listen(config.port, () => {
        console.log(`
============================================
  BOT WHATSAPP IA PRO - PHASE 0
============================================
  Serveur demarre sur le port ${config.port}
  Webhook: POST /webhook
  Health:  GET  /health
  Privacy: GET  /privacy

  Cout: 0$ | CB: Non requise
  Modele: Llama 3.3 (Groq)
============================================
        `);
    });
}

start();