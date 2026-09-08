import { Router } from 'express';
import {
  createBorrower,
  getBorrowers,
  verifyBorrowerQR,
  getBorrowerById,
} from '../controllers/borrowerController.js';
import { validate, borrowerSchemas } from '../middleware/validate.js';

const router = Router();

// GET /api/borrowers/verify/:code
router.get('/verify/:code', verifyBorrowerQR);

// POST /api/borrowers
router.post('/', validate(borrowerSchemas.create), createBorrower);

// GET /api/borrowers
router.get('/', getBorrowers);

// GET /api/borrowers/:id
router.get('/:id', getBorrowerById);

export default router;
