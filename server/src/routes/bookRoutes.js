import { Router } from 'express';
import {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  verifyBookQR,
  getCategories,
  regenerateQR,
} from '../controllers/bookController.js';
import { validate, bookSchemas } from '../middleware/validate.js';

const router = Router();

// GET /api/books/categories - must be before /:id to avoid conflict
router.get('/categories', getCategories);

// GET /api/books/verify/:code - verify QR scanned code
router.get('/verify/:code', verifyBookQR);

// POST /api/books - create a new book
router.post('/', validate(bookSchemas.create), createBook);

// GET /api/books - list all books with search/filter/pagination
router.get('/', getBooks);

// GET /api/books/:id - get single book
router.get('/:id', getBookById);

// PUT /api/books/:id - update book
router.put('/:id', validate(bookSchemas.update), updateBook);

// DELETE /api/books/:id - delete book
router.delete('/:id', deleteBook);

// POST /api/books/:id/regenerate-qr - regenerate QR code
router.post('/:id/regenerate-qr', regenerateQR);

export default router;
