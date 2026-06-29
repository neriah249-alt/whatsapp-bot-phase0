const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const supabase = createClient(config.supabase.url, config.supabase.key);

/**
 * Sauvegarde une conversation dans Supabase
 * @param {Object} conversationData 
 */
async function saveConversation(conversationData) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        phone_number_hash: hashPhoneNumber(conversationData.phoneNumber),
        message_in: conversationData.messageIn,
        message_out: conversationData.messageOut,
        intent: conversationData.intent || null,
        response_time_ms: conversationData.responseTime || null,
        model_used: conversationData.modelUsed || 'llama-3.3-70b',
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Erreur Supabase:', error);
      return null;
    }

    console.log('Conversation sauvegardee en base');
    return data;
  } catch (error) {
    console.error('Erreur sauvegarde conversation:', error);
    return null;
  }
}

/**
 * Pseudonymise le numero de telephone (SHA-256)
 * Conformite RGPD / protection donnees personnelles
 */
function hashPhoneNumber(phoneNumber) {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(phoneNumber)
    .digest('hex')
    .substring(0, 16); // Tronque pour l'affichage
}

/**
 * Cree la table conversations si elle n'existe pas
 * A executer une fois au demarrage
 */
async function initDatabase() {
  try {
    // Supabase gere le schema via l'interface web
    // Creez manuellement la table avec ce SQL dans l'editeur Supabase:
    /*
    CREATE TABLE conversations (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      phone_number_hash VARCHAR(32) NOT NULL,
      message_in TEXT,
      message_out TEXT,
      intent VARCHAR(100),
      response_time_ms INTEGER,
      model_used VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_conversations_phone ON conversations(phone_number_hash);
    CREATE INDEX idx_conversations_created ON conversations(created_at);
    */
    console.log('Base de donnees initialisee (verifiez table dans Supabase)');
  } catch (error) {
    console.error('Erreur init DB:', error);
  }
}

module.exports = {
  saveConversation,
  initDatabase,
  hashPhoneNumber
};