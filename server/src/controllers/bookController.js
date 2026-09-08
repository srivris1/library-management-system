import Book from '../models/Book.js';
import { generateQRCode } from '../utils/qrGenerator.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * @desc    Create a new book and auto-generate its QR code
 * @route   POST /api/books
 */
export const createBook = async (req, res, next) => {
  try {
    const { bookId, title, author, isbn, category, description, totalCopies, coverImage } =
      req.body;

    // Check for duplicate bookId
    const existingBook = await Book.findOne({ bookId });
    if (existingBook) {
      throw new AppError(`Book with ID "${bookId}" already exists`, 409);
    }

    // Generate QR code for this book
    const qrCodeDataUrl = await generateQRCode(bookId, 'BOOK');

    const book = await Book.create({
      bookId,
      title,
      author,
      isbn,
      category,
      description,
      totalCopies,
      availableCopies: totalCopies,
      qrCodeDataUrl,
      coverImage,
    });

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all books with search, filter, and pagination
 * @route   GET /api/books
 * @query   search, category, availability, page, limit, sortBy, sortOrder
 */
export const getBooks = async (req, res, next) => {
  try {
    const {
      search = '',
      category = '',
      availability = '',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Text search (title, author, description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { bookId: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Availability filter
    if (availability === 'available') {
      query.availableCopies = { $gt: 0 };
    } else if (availability === 'unavailable') {
      query.availableCopies = 0;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [books, total] = await Promise.all([
      Book.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Book.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: books,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single book by ID or MongoDB _id
 * @route   GET /api/books/:id
 */
export const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let book = await Book.findOne({ bookId: id.toUpperCase() });
    if (!book) {
      book = await Book.findById(id).catch(() => null);
    }
    if (!book) {
      throw new AppError(`Book not found with ID: ${id}`, 404);
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a book
 * @route   PUT /api/books/:id
 */
export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let book = await Book.findOne({ bookId: id.toUpperCase() });
    if (!book) {
      book = await Book.findById(id).catch(() => null);
    }
    if (!book) {
      throw new AppError(`Book not found with ID: ${id}`, 404);
    }

    // If totalCopies is being changed, adjust availableCopies proportionally
    if (updates.totalCopies !== undefined) {
      const diff = updates.totalCopies - book.totalCopies;
      const newAvailable = book.availableCopies + diff;
      if (newAvailable < 0) {
        throw new AppError(
          `Cannot reduce total copies below currently issued count. ${book.totalCopies - book.availableCopies} copies are currently issued.`,
          400
        );
      }
      updates.availableCopies = newAvailable;
    }

    Object.assign(book, updates);
    await book.save();

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a book (only if no copies are currently issued)
 * @route   DELETE /api/books/:id
 */
export const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    let book = await Book.findOne({ bookId: id.toUpperCase() });
    if (!book) {
      book = await Book.findById(id).catch(() => null);
    }
    if (!book) {
      throw new AppError(`Book not found with ID: ${id}`, 404);
    }

    if (book.availableCopies < book.totalCopies) {
      throw new AppError(
        'Cannot delete book while copies are still issued. Return all copies first.',
        400
      );
    }

    await Book.deleteOne({ _id: book._id });

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify a scanned QR code and return book details
 * @route   GET /api/books/verify/:code
 */
export const verifyBookQR = async (req, res, next) => {
  try {
    const { code } = req.params;

    // Try to parse as JSON QR payload
    let bookId = code;
    try {
      const parsed = JSON.parse(decodeURIComponent(code));
      if (parsed.id) bookId = parsed.id;
    } catch {
      // code is already a plain book ID string
    }

    const book = await Book.findOne({ bookId: bookId.toUpperCase() });
    if (!book) {
      throw new AppError(`No book found for scanned QR code: ${bookId}`, 404);
    }

    res.json({
      success: true,
      data: {
        ...book.toJSON(),
        canIssue: book.availableCopies > 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all unique categories
 * @route   GET /api/books/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Book.distinct('category');
    res.json({
      success: true,
      data: categories.sort(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Regenerate QR code for a book
 * @route   POST /api/books/:id/regenerate-qr
 */
export const regenerateQR = async (req, res, next) => {
  try {
    const { id } = req.params;

    let book = await Book.findOne({ bookId: id.toUpperCase() });
    if (!book) {
      book = await Book.findById(id).catch(() => null);
    }
    if (!book) {
      throw new AppError(`Book not found with ID: ${id}`, 404);
    }

    const qrCodeDataUrl = await generateQRCode(book.bookId, 'BOOK');
    book.qrCodeDataUrl = qrCodeDataUrl;
    await book.save();

    res.json({
      success: true,
      message: 'QR code regenerated successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  verifyBookQR,
  getCategories,
  regenerateQR,
};
