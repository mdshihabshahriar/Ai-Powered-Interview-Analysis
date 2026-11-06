import dotenv from 'dotenv';
dotenv.config();
export const config = {
    port: parseInt(process.env.PORT || '5001', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    stunServers: (process.env.STUN_SERVERS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    turnServerUrl: process.env.TURN_SERVER_URL || '',
    turnServerUsername: process.env.TURN_SERVER_USERNAME || '',
    turnServerCredential: process.env.TURN_SERVER_CREDENTIAL || '',
};
