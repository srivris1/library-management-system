import { Router } from 'express';
import {
  issueBook,
  returnBook,
  getTransactions,
  getOverdueTransactions,
  getTransactionById,
} from '../controllers/transactionController.js';
import { validate, transactionSchemas } from '../middleware/validate.js';

const router = Router();

// GET /api/transactions/overdue - must be before /:id
router.get('/overdue', getOverdueTransactions);

// POST /api/transactions/issue - issue a book
router.post('/issue', validate(transactionSchemas.issue), issueBook);

// POST /api/transactions/return - return a book
router.post('/return', validate(transactionSchemas.return), returnBook);

// GET /api/transactions - list all transactions
router.get('/', getTransactions);

// GET /api/transactions/:id - single transaction
router.get('/:id', getTransactionById);

export default router;
