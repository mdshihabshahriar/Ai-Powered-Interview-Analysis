import { roomManager } from '../services/roomManager.js';
import { calculateAskedQuestionsSummary } from '../services/evaluationService.js';
import { config } from '../config.js';
export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        // Join room
        socket.on('room:join', ({ roomId, name, role }) => {
            const cleanRoomId = roomId?.toUpperCase().trim();
            const result = roomManager.joinRoom(cleanRoomId, socket.id, name, role);
            if (!result.success || !result.room) {
                socket.emit('room:error', { message: result.error || 'Failed to join room' });
                return;
            }
            socket.join(cleanRoomId);
            const iceServers = [
                ...config.stunServers.map(url => ({ urls: url })),
                ...(config.turnServerUrl
                    ? [
                        {
                            urls: config.turnServerUrl,
                            username: config.turnServerUsername,
                            credential: config.turnServerCredential,
                        },
                    ]
                    : []),
            ];
            if (role === 'interviewer') {
                socket.emit('room:joined', {
                    roomId: cleanRoomId,
                    role,
                    room: result.room,
                    activeAskedQuestion: roomManager.getActiveAskedQuestion(cleanRoomId),
                    askedQuestions: result.room.askedQuestions,
                    iceServers,
                });
            }
            else {
                // Candidate receives sanitized room without any questions or answers
                socket.emit('room:joined', {
                    roomId: cleanRoomId,
                    role,
                    room: roomManager.getSanitizedRoomForCandidate(result.room),
                    iceServers,
                });
            }
            // Notify peer that someone joined
            socket.to(cleanRoomId).emit('peer:joined', {
                socketId: socket.id,
                name,
                role,
            });
            // Peers ready signal
            const updatedRoom = roomManager.getRoom(cleanRoomId);
            if (updatedRoom?.interviewer && updatedRoom?.candidate) {
                io.to(cleanRoomId).emit('room:peers-ready', {
                    interviewer: updatedRoom.interviewer,
                    candidate: updatedRoom.candidate,
                });
            }
        });
        // WebRTC Signaling
        socket.on('webrtc:offer', ({ to, offer }) => {
            io.to(to).emit('webrtc:offer', { from: socket.id, offer });
        });
        socket.on('webrtc:answer', ({ to, answer }) => {
            io.to(to).emit('webrtc:answer', { from: socket.id, answer });
        });
        socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
            io.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
        });
        // Media status toggle (mute/video)
        socket.on('media:toggle', ({ audioMuted, videoOff }) => {
            const { roomId, participant } = roomManager.updateMediaStatus(socket.id, audioMuted, videoOff);
            if (roomId && participant) {
                socket.to(roomId).emit('peer:media-changed', {
                    role: participant.role,
                    audioMuted: participant.audioMuted,
                    videoOff: participant.videoOff,
                });
            }
        });
        // Interview Start
        socket.on('interview:start', ({ roomId }) => {
            const room = roomManager.startInterview(roomId);
            if (!room)
                return;
            // Broadcast interview started (Candidate receives ONLY started status, NO questions)
            io.to(room.id).emit('interview:started', {
                startedAt: room.startedAt,
            });
        });
        // Dynamic Question Asking by Interviewer
        socket.on('question:ask', ({ roomId, questionText, threshold }) => {
            const cleanRoomId = roomId?.toUpperCase().trim();
            const room = roomManager.getRoom(cleanRoomId);
            if (!room)
                return;
            const result = roomManager.askQuestion(cleanRoomId, questionText, threshold);
            if (result.success) {
                // Matched! Interviewer receives the matched question, expected answer, and confidence
                socket.emit('question:matched', {
                    record: result.record,
                    askedQuestions: room.askedQuestions,
                });
                // Tell candidate's background speech listener that an active question is in progress
                // NOTE: Candidate does NOT receive the question text, expected answer, or category!
                if (room.candidate) {
                    io.to(room.candidate.socketId).emit('interview:active-listening', {
                        isActive: true,
                    });
                }
            }
            else {
                // Match failed! Display "No Matching Question Found" on interviewer dashboard
                socket.emit('question:match-failed', {
                    error: 'No Matching Question Found',
                    record: result.record,
                    interviewerQuestion: questionText,
                    confidence: result.record.matchConfidence,
                    askedQuestions: room.askedQuestions,
                });
            }
        });
        // Live Candidate Speech Streaming (interviewer sees candidate speaking in real time)
        socket.on('candidate:speech-transcript', ({ roomId, text, isFinal }) => {
            const room = roomManager.getRoom(roomId);
            if (!room || !room.interviewer)
                return;
            io.to(room.interviewer.socketId).emit('candidate:speech-stream', {
                text,
                isFinal,
                timestamp: new Date().toISOString(),
            });
        });
        // Submit / Evaluate Candidate Answer for currently active matched question
        socket.on('candidate:submit-answer', async ({ roomId, answerText }) => {
            const room = roomManager.getRoom(roomId);
            if (!room)
                return;
            try {
                const evalOutcome = await roomManager.evaluateCurrentAnswer(roomId, answerText);
                if (evalOutcome.isGreeting) {
                    if (room.interviewer) {
                        io.to(room.interviewer.socketId).emit('evaluation:greeting-ignored', {
                            text: answerText,
                            message: 'Casual greeting or pleasantry filtered. Not evaluated as an answer.',
                        });
                    }
                    return;
                }
                if (evalOutcome.record && room.interviewer) {
                    // Interviewer receives evaluation score, status, feedback
                    io.to(room.interviewer.socketId).emit('evaluation:result', {
                        record: evalOutcome.record,
                        askedQuestions: room.askedQuestions,
                        summary: calculateAskedQuestionsSummary(room.askedQuestions),
                    });
                }
                // Candidate receives neutral acknowledgement only (NO scores, NO answers)
                if (room.candidate) {
                    io.to(room.candidate.socketId).emit('answer:acknowledged', {
                        message: 'Your answer has been recorded.',
                    });
                }
            }
            catch (err) {
                console.error('[Socket] Error evaluating answer:', err.message);
            }
        });
        // Mark current active question as unanswered (Interviewer button)
        socket.on('question:mark-unanswered', ({ roomId }) => {
            const room = roomManager.getRoom(roomId);
            if (!room)
                return;
            const record = roomManager.markActiveAsUnanswered(roomId);
            if (record && room.interviewer) {
                io.to(room.interviewer.socketId).emit('evaluation:result', {
                    record,
                    askedQuestions: room.askedQuestions,
                    summary: calculateAskedQuestionsSummary(room.askedQuestions),
                });
            }
        });
        // Interview End
        socket.on('interview:end', ({ roomId }) => {
            const result = roomManager.endInterview(roomId);
            if (!result)
                return;
            const { room, summary } = result;
            // Broadcast interview ended to all participants
            io.to(room.id).emit('interview:ended', {
                endedAt: room.endedAt,
                summary,
            });
            // Interviewer receives the full evaluation record of asked and matched questions
            if (room.interviewer) {
                io.to(room.interviewer.socketId).emit('interview:final-report', {
                    room,
                    summary,
                    askedQuestions: room.askedQuestions,
                });
            }
        });
        // Disconnect handling
        socket.on('disconnect', () => {
            const { roomId, role } = roomManager.handleDisconnect(socket.id);
            if (roomId && role) {
                socket.to(roomId).emit('peer:disconnected', {
                    socketId: socket.id,
                    role,
                });
            }
        });
    });
}
