import express from 'express';
import { getPortfolioHoldings, getUserSummary } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/portfolio/:portfolioId/holdings', authenticateToken, getPortfolioHoldings);
router.get('/user/summary', authenticateToken, getUserSummary);

export default router;
