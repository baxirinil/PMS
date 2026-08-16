import express from 'express';
import { addTransaction } from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, addTransaction);

export default router;
