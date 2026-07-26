import { Router } from 'express';
import { createQuiz, getMyQuizzes, getQuizById, deleteQuiz } from '../controllers/quizController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, createQuiz);
router.get('/my', authMiddleware, getMyQuizzes);
router.get('/:id', authMiddleware, getQuizById);
router.delete('/:id', authMiddleware, deleteQuiz);

export default router;