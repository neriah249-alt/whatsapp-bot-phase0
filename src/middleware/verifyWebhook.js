const crypto = require('crypto');
const config = require('../config');

/**
 * Verifie la signature HMAC-SHA256 des webhooks Meta
 * Protection contre les requetes frauduleuses
 */
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    console.warn('Signature Meta manquante');
    return res.status(401).json({ error: 'Signature manquante' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.meta.appSecret)
    .update(JSON.stringify(req.body), 'utf8')
    .digest('hex');

  const expectedSignatureWithPrefix = `sha256=${expectedSignature}`;

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignatureWithPrefix, 'utf8')
    );

    if (!isValid) {
      console.warn('Signature Meta invalide');
      return res.status(403).json({ error: 'Signature invalide' });
    }

    console.log('Signature Meta verifiee');
    next();
  } catch (error) {
    console.error('Erreur verification signature:', error);
    return res.status(403).json({ error: 'Erreur verification signature' });
  }
}

module.exports = { verifyWebhookSignature };