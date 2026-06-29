const config = require('../config');

async function redisRequest(command, args) {
    try {
        const url = config.redis.url + '/' + command + '/' + args.join('/');
        const response = await fetch(url, {
            headers: { Authorization: 'Bearer ' + config.redis.token }
        });
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Erreur Redis:', error.message);
        return null;
    }
}

async function getContext(phoneNumber, limit) {
    limit = limit || 5;
    try {
        const key = 'chat:' + phoneNumber;
        const result = await redisRequest('lrange', [key, -limit, -1]);
        if (!result) return [];
        return result.map(function(msg) { return JSON.parse(msg); });
    } catch (error) {
        console.error('Erreur Redis getContext:', error);
        return [];
    }
}

async function saveMessage(phoneNumber, role, content) {
    try {
        const key = 'chat:' + phoneNumber;
        const message = JSON.stringify({ role: role, content: content, timestamp: Date.now() });
        await redisRequest('rpush', [key, encodeURIComponent(message)]);
        await redisRequest('ltrim', [key, -10, -1]);
        await redisRequest('expire', [key, 86400]);
        console.log('Message sauvegarde Redis pour ' + phoneNumber);
    } catch (error) {
        console.error('Erreur Redis saveMessage:', error);
    }
}

async function isOptedOut(phoneNumber) {
    try {
        const key = 'optout:' + phoneNumber;
        const result = await redisRequest('get', [key]);
        return result === 'true';
    } catch (error) {
        return false;
    }
}

async function setOptOut(phoneNumber) {
    try {
        const key = 'optout:' + phoneNumber;
        await redisRequest('set', [key, 'true']);
        await redisRequest('expire', [key, 2592000]);
        console.log('Opt-out enregistre pour ' + phoneNumber);
    } catch (error) {
        console.error('Erreur opt-out:', error);
    }
}

module.exports = { getContext, saveMessage, isOptedOut, setOptOut };