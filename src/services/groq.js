const Groq = require('groq-sdk');
const config = require('../config');

const groq = new Groq({ apiKey: config.groq.apiKey });

/**
 * Genere une reponse avec Llama 3.3 70B via Groq
 * @param {Array} messages - Historique de conversation format OpenAI
 * @returns {Promise<string>} Reponse de l'IA
 */
async function generateResponse(messages) {
  const startTime = Date.now();

  try {
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: config.groq.model,
      temperature: config.groq.temperature,
      max_tokens: config.groq.maxTokens,
      top_p: 1,
      stream: false
    });

    const responseTime = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content || '';

    console.log(`Reponse Groq generee en ${responseTime}ms`);
    return {
      content: content.trim(),
      responseTime,
      model: config.groq.model,
      usage: completion.usage
    };
  } catch (error) {
    console.error('Erreur Groq API:', error.message);
    throw error;
  }
}

/**
 * Fallback si Groq est indisponible
 * Reponses predefinies selon les intentions detectees
 */
function getFallbackResponse(message) {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('prix') || lowerMsg.includes('combien')) {
    return "Je peux vous donner nos tarifs. Pour quel produit ou service souhaitez-vous un devis ?";
  }
  if (lowerMsg.includes('horaire') || lowerMsg.includes('ouvert')) {
    return "Nous sommes ouverts du lundi au vendredi de 8h a 18h, et le samedi de 9h a 14h.";
  }
  if (lowerMsg.includes('livraison') || lowerMsg.includes('livrer')) {
    return "Nous livrons a Cotonou (24h), Porto-Novo et Parakou (48h). Frais: 1 000 a 3 000 FCFA.";
  }
  if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut')) {
    return "Bonjour ! Je suis l'assistant virtuel de l'entreprise. Comment puis-je vous aider aujourd'hui ?";
  }

  return config.bot.fallbackMessage;
}

module.exports = {
  generateResponse,
  getFallbackResponse
};