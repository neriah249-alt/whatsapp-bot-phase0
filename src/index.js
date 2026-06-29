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

// Page d'accueil
app.get('/', (req, res) => {
  res.json({
    message: 'Bot WhatsApp IA Pro - Phase 0',
    documentation: 'CDC v1.1 - Lean Startup',
    endpoints: {
      webhook: 'POST /webhook (reception messages Meta)',
      health: 'GET /health (statut serveur)'
    },
    limits: {
      maxTestNumbers: 5,
      contextMessages: 5,
      groqRequestsPerMinute: 30
    }
  });
});

// Demarrage
async function start() {
  try {
    await initDatabase();

    app.listen(config.port, () => {
      console.log(`
============================================
  BOT WHATSAPP IA PRO - PHASE 0
============================================
  Serveur demarre sur le port ${config.port}
  Webhook: POST /webhook
  Health:  GET  /health

  Cout: 0$ | CB: Non requise
  Modele: Llama 3.3 (Groq)
============================================
      `);
    });
  } catch (error) {
    console.error('Erreur demarrage:', error);
    process.exit(1);
  }
}

start();