import Book from '../models/Book.js';
import Transaction from '../models/Transaction.js';
import { AppError } from '../middleware/errorHandler.js';

const FINE_PER_DAY = parseInt(process.env.FINE_PER_DAY) || 5;
const DEFAULT_LOAN_DAYS = parseInt(process.env.DEFAULT_LOAN_DAYS) || 14;

/**
 * @desc    Issue a book to a borrower (atomic stock decrement)
 * @route   POST /api/transactions/issue
 */
export const issueBook = async (req, res, next) => {
  try {
    const { bookId, borrower, loanDays } = req.body;
    const actualLoanDays = loanDays || DEFAULT_LOAN_DAYS;

    // Find the book
    const book = await Book.findOne({ bookId: bookId.toUpperCase() });
    if (!book) {
      throw new AppError(`Book not found with ID: ${bookId}`, 404);
    }

    // Check if this borrower already has this book issued
    const existingIssue = await Transaction.findOne({
      book: book._id,
      'borrower.studentId': borrower.studentId.toUpperCase(),
      status: 'ISSUED',
    });
    if (existingIssue) {
      throw new AppError(
        `This book is already issued to student ${borrower.studentId}. Return it first before re-issuing.`,
        409
      );
    }

    // Atomic decrement - prevents race conditions
    // Only decrements if availableCopies > 0
    const updatedBook = await Book.findOneAndUpdate(
      { _id: book._id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      throw new AppError(
        `No available copies of "${book.title}" (${book.bookId}). All ${book.totalCopies} copies are currently issued.`,
        400
      );
    }

    // Calculate due date
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + actualLoanDays);

    // Create the transaction record
    const transaction = await Transaction.create({
      book: book._id,
      bookId: book.bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      borrower: {
        studentId: borrower.studentId.toUpperCase(),
        name: borrower.name,
        email: borrower.email || '',
        phone: borrower.phone || '',
      },
      issueDate,
      dueDate,
      status: 'ISSUED',
    });

    res.status(201).json({
      success: true,
      message: `Book "${book.title}" issued successfully to ${borrower.name}`,
      data: {
        transaction,
        book: updatedBook,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Return a book (atomic stock increment + overdue/fine calculation)
 * @route   POST /api/transactions/return
 */
export const returnBook = async (req, res, next) => {
  try {
    const { bookId, studentId } = req.body;

    // Find the active transaction
    const transaction = await Transaction.findOne({
      bookId: bookId.toUpperCase(),
      'borrower.studentId': studentId.toUpperCase(),
      status: 'ISSUED',
    });

    if (!transaction) {
      // Check if the book exists at all
      const bookExists = await Book.findOne({ bookId: bookId.toUpperCase() });
      if (!bookExists) {
        throw new AppError(`Book not found with ID: ${bookId}`, 404);
      }
      throw new AppError(
        `No active issue found for book "${bookId}" and student "${studentId}". The book may have already been returned.`,
        404
      );
    }

    // Set return date and calculate fine
    const returnDate = new Date();
    let fineAmount = 0;
    let overdueDays = 0;

    if (returnDate > transaction.dueDate) {
      const diffMs = returnDate - transaction.dueDate;
      overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * FINE_PER_DAY;
    }

    // Update the transaction
    transaction.returnDate = returnDate;
    transaction.status = 'RETURNED';
    transaction.fineAmount = fineAmount;
    await transaction.save();

    // Atomic increment of available copies
    const updatedBook = await Book.findOneAndUpdate(
      { _id: transaction.book },
      { $inc: { availableCopies: 1 } },
      { new: true }
    );

    res.json({
      success: true,
      message: `Book "${transaction.bookTitle}" returned successfully by ${transaction.borrower.name}`,
      data: {
        transaction: {
          ...transaction.toJSON(),
          overdueDays,
        },
        fineAmount,
        overdueDays,
        book: updatedBook,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transaction history with filters and pagination
 * @route   GET /api/transactions
 * @query   status, bookId, studentId, search, page, limit, sortBy, sortOrder, fromDate, toDate
 */
export const getTransactions = async (req, res, next) => {
  try {
    const {
      status = '',
      bookId = '',
      studentId = '',
      search = '',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fromDate = '',
      toDate = '',
    } = req.query;

    const query = {};

    if (status) {
      query.status = status.toUpperCase();
    }
    if (bookId) {
      query.bookId = bookId.toUpperCase();
    }
    if (studentId) {
      query['borrower.studentId'] = studentId.toUpperCase();
    }
    if (search) {
      query.$or = [
        { bookTitle: { $regex: search, $options: 'i' } },
        { bookId: { $regex: search, $options: 'i' } },
        { bookAuthor: { $regex: search, $options: 'i' } },
        { 'borrower.name': { $regex: search, $options: 'i' } },
        { 'borrower.studentId': { $regex: search, $options: 'i' } },
      ];
    }
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) query.issueDate.$gte = new Date(fromDate);
      if (toDate) query.issueDate.$lte = new Date(toDate);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    // Mark overdue transactions dynamically
    const now = new Date();
    const enrichedTransactions = transactions.map((t) => {
      const obj = t.toJSON();
      if (obj.status === 'ISSUED' && now > new Date(obj.dueDate)) {
        obj.status = 'OVERDUE';
        const diffMs = now - new Date(obj.dueDate);
        obj.overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        obj.currentFine = obj.overdueDays * FINE_PER_DAY;
      }
      return obj;
    });

    res.json({
      success: true,
      data: enrichedTransactions,
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
 * @desc    Get all currently overdue transactions
 * @route   GET /api/transactions/overdue
 */
export const getOverdueTransactions = async (req, res, next) => {
  try {
    const now = new Date();
    const overdueTransactions = await Transaction.find({
      status: 'ISSUED',
      dueDate: { $lt: now },
    }).sort({ dueDate: 1 });

    const enriched = overdueTransactions.map((t) => {
      const obj = t.toJSON();
      const diffMs = now - new Date(obj.dueDate);
      obj.overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      obj.currentFine = obj.overdueDays * FINE_PER_DAY;
      obj.status = 'OVERDUE';
      return obj;
    });

    res.json({
      success: true,
      data: enriched,
      count: enriched.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single transaction by ID
 * @route   GET /api/transactions/:id
 */
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  issueBook,
  returnBook,
  getTransactions,
  getOverdueTransactions,
  getTransactionById,
};
