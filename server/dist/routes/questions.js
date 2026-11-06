import { Router } from 'express';
import { getAllQuestions, getQuestionById } from '../services/evaluationService.js';
const router = Router();
// Get all predefined questions
router.get('/', (req, res) => {
    const questions = getAllQuestions();
    res.json({
        success: true,
        count: questions.length,
        questions,
    });
});
// Get question by ID
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const question = getQuestionById(id);
    if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
    }
    res.json({ success: true, question });
});
export default router;
