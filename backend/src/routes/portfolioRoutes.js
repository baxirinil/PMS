import express from 'express';
import { getUserPortfolios, createPortfolio } from '../controllers/portfolioController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getUserPortfolios);
router.post('/', authenticateToken, createPortfolio);

export default router;
