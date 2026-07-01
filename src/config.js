require('dotenv').config();

module.exports = {
    meta: {
        appSecret: process.env.META_APP_SECRET,
        accessToken: process.env.META_ACCESS_TOKEN,
        phoneNumberId: process.env.META_PHONE_NUMBER_ID,
        apiVersion: 'v21.0'
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.3-70b-versatile',
        maxTokens: 1024,
        temperature: 0.7
    },
    redis: {
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SERVICE_KEY
    },
    bot: {
        maxContextMessages: parseInt(process.env.MAX_CONTEXT_MESSAGES) || 5,
        humanTransferKeywords: process.env.HUMAN_TRANSFER_KEYWORDS ? .split(',') || [],
        fallbackMessage: process.env.FALLBACK_MESSAGE,
        systemPromptPath: process.env.SYSTEM_PROMPT_PATH
    },
    port: process.env.PORT || 3000
};