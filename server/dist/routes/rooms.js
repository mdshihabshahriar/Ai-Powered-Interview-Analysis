import { Router } from 'express';
import { roomManager } from '../services/roomManager.js';
import { calculateAskedQuestionsSummary } from '../services/evaluationService.js';
const router = Router();
// Create new room
router.post('/', (req, res) => {
    const { interviewerName } = req.body;
    const room = roomManager.createRoom(interviewerName || 'Interviewer');
    res.json({
        success: true,
        roomId: room.id,
        room,
    });
});
// Check room status & validity
router.get('/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { role } = req.query;
    const room = roomManager.getRoom(roomId);
    if (!room) {
        return res.status(404).json({ success: false, error: 'Interview room not found' });
    }
    if (room.status === 'completed') {
        return res.status(400).json({ success: false, error: 'This interview has already ended' });
    }
    if (role === 'candidate' && room.candidate) {
        return res.status(409).json({
            success: false,
            error: 'Room already occupied by another candidate',
        });
    }
    if (role === 'candidate') {
        return res.json({
            success: true,
            room: roomManager.getSanitizedRoomForCandidate(room),
        });
    }
    return res.json({
        success: true,
        room,
    });
});
// Get final interview report & CSV export data (ONLY asked and matched questions)
router.get('/:roomId/report', (req, res) => {
    const { roomId } = req.params;
    const room = roomManager.getRoom(roomId);
    if (!room) {
        return res.status(404).json({ success: false, error: 'Interview room not found' });
    }
    // Filter ONLY asked and successfully matched questions according to spec
    const matchedAskedQuestions = room.askedQuestions.filter((q) => q.isMatched);
    const summary = calculateAskedQuestionsSummary(room.askedQuestions);
    const format = req.query.format;
    if (format === 'csv') {
        const candidateName = room.candidate?.name || 'Candidate';
        const interviewDate = room.startedAt
            ? new Date(room.startedAt).toLocaleDateString()
            : new Date().toLocaleDateString();
        const escapeCsv = (str) => {
            if (str === null || str === undefined)
                return '""';
            const s = String(str).replace(/"/g, '""');
            return `"${s}"`;
        };
        // Exactly 11 required columns from Section 5
        const headers = [
            'Interview ID',
            'Room Code',
            'Candidate Name',
            "Interviewer's Original Question",
            'Matched JSON Question',
            'Expected Answer',
            "Candidate's Actual Answer",
            'Similarity Score',
            'Evaluation Status',
            'AI Feedback',
            'Interview Date',
        ];
        const rows = matchedAskedQuestions.map((q) => {
            const candidateAns = q.candidateAnswer ? q.candidateAnswer : 'Not Answered';
            return [
                escapeCsv(room.id),
                escapeCsv(room.id),
                escapeCsv(candidateName),
                escapeCsv(q.interviewerQuestion),
                escapeCsv(q.matchedQuestion || ''),
                escapeCsv(q.matchedExpectedAnswer || ''),
                escapeCsv(candidateAns),
                escapeCsv(q.similarityScore),
                escapeCsv(q.evaluationStatus),
                escapeCsv(q.aiFeedback),
                escapeCsv(interviewDate),
            ].join(',');
        });
        const summaryRows = [
            '',
            '--- INTERVIEW EVALUATION SUMMARY ---,,,,,,,,,,',
            `Overall Interview Score,${summary.overallScore}%,,,,,,,,,`,
            `Total Questions Asked,${summary.totalQuestionsAsked},,,,,,,,,`,
            `Successfully Matched Questions,${summary.successfullyMatchedQuestions},,,,,,,,,`,
            `Answered Questions,${summary.answeredCount},,,,,,,,,`,
            `Unanswered Questions,${summary.unansweredCount},,,,,,,,,`,
        ];
        // UTF-8 BOM for Microsoft Excel compatibility
        const csvContent = '\uFEFF' + [headers.join(','), ...rows, ...summaryRows].join('\r\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="Interview-Report-${room.id}.csv"`);
        return res.send(csvContent);
    }
    res.json({
        success: true,
        room,
        summary,
        askedQuestions: matchedAskedQuestions,
    });
});
export default router;
