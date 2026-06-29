const { Redis } = require('ioredis');
const config = require('../config');

let redis = null;

function getRedisClient() {
  if (!redis) {
    redis = new Redis({
      url: config.redis.url,
      token: config.redis.token
    });
  }
  return redis;
}

/**
 * Recupere le contexte des dernieres conversations
 * @param {string} phoneNumber - Numero WhatsApp du client
 * @param {number} limit - Nombre de messages a recuperer (defaut: 5)
 */
async function getContext(phoneNumber, limit = 5) {
  try {
    const client = getRedisClient();
    const key = `chat:${phoneNumber}`;
    const messages = await client.lrange(key, -limit, -1);

    return messages.map(msg => JSON.parse(msg));
  } catch (error) {
    console.error('Erreur Redis getContext:', error);
    return [];
  }
}

/**
 * Sauvegarde un message dans le contexte
 * @param {string} phoneNumber 
 * @param {string} role - 'user' ou 'assistant'
 * @param {string} content 
 */
async function saveMessage(phoneNumber, role, content) {
  try {
    const client = getRedisClient();
    const key = `chat:${phoneNumber}`;
    const message = JSON.stringify({ role, content, timestamp: Date.now() });

    await client.rpush(key, message);
    // Garde seulement les 10 derniers messages (marge de securite)
    await client.ltrim(key, -10, -1);
    // Expire apres 24h (conformite Meta fenetre 24h)
    await client.expire(key, 86400);

    console.log(`Message sauvegarde pour ${phoneNumber}`);
  } catch (error) {
    console.error('Erreur Redis saveMessage:', error);
  }
}

/**
 * Verifie si l'utilisateur a demande STOP
 */
async function isOptedOut(phoneNumber) {
  try {
    const client = getRedisClient();
    const key = `optout:${phoneNumber}`;
    const optedOut = await client.get(key);
    return optedOut === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Marque l'utilisateur comme desinscrit
 */
async function setOptOut(phoneNumber) {
  try {
    const client = getRedisClient();
    const key = `optout:${phoneNumber}`;
    await client.set(key, 'true', 'EX', 2592000); // 30 jours
    console.log(`Opt-out enregistre pour ${phoneNumber}`);
  } catch (error) {
    console.error('Erreur opt-out:', error);
  }
}

module.exports = {
  getContext,
  saveMessage,
  isOptedOut,
  setOptOut
};