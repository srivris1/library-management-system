import { Router } from 'express';
import { smartSearch, getRecommendations, autoCategorize, chat } from '../controllers/aiController.js';

const router = Router();

// POST /api/ai/smart-search
router.post('/smart-search', smartSearch);

// POST /api/ai/recommend
router.post('/recommend', getRecommendations);

// POST /api/ai/categorize
router.post('/categorize', autoCategorize);

// POST /api/ai/chat
router.post('/chat', chat);

export default router;
