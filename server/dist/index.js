import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './config.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import roomsRouter from './routes/rooms.js';
import questionsRouter from './routes/questions.js';
import { loadQuestions } from './services/evaluationService.js';
const app = express();
const server = http.createServer(app);
// Configure Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
// Middlewares
app.use(cors());
app.use(express.json());
// Pre-load interview questions from JSON
loadQuestions();
// Setup routes
app.use('/api/rooms', roomsRouter);
app.use('/api/questions', questionsRouter);
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
// Setup real-time WebSockets
setupSocketHandlers(io);
// Graceful port error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${config.port} is already in use.`);
        console.error(`Run "npm run clean:ports" to free up ports 5001 and 5173.\n`);
        process.exit(1);
    }
    else {
        throw err;
    }
});
// Start server
server.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 EvalVue AI Interview Backend running on port ${config.port}`);
    console.log(`📡 Socket.IO signaling ready for WebRTC`);
    console.log(`🧠 AI Evaluation: ${config.geminiApiKey ? 'Gemini API + NLP Fallback' : 'Built-in Local Semantic NLP Evaluator'}`);
    console.log(`=======================================================`);
});
