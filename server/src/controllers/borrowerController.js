import Borrower from '../models/Borrower.js';
import { generateQRCode } from '../utils/qrGenerator.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * @desc    Register a new borrower with a digital library pass QR
 * @route   POST /api/borrowers
 */
export const createBorrower = async (req, res, next) => {
  try {
    const { studentId, name, email, phone, department, year } = req.body;

    const existing = await Borrower.findOne({ studentId: studentId.toUpperCase() });
    if (existing) {
      throw new AppError(`Borrower with student ID "${studentId}" already exists`, 409);
    }

    const qrCodeDataUrl = await generateQRCode(studentId.toUpperCase(), 'STUDENT');

    const borrower = await Borrower.create({
      studentId: studentId.toUpperCase(),
      name,
      email,
      phone,
      department,
      year,
      qrCodeDataUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Borrower registered successfully',
      data: borrower,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all borrowers
 * @route   GET /api/borrowers
 */
export const getBorrowers = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [borrowers, total] = await Promise.all([
      Borrower.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Borrower.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: borrowers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify a borrower QR code
 * @route   GET /api/borrowers/verify/:code
 */
export const verifyBorrowerQR = async (req, res, next) => {
  try {
    const { code } = req.params;

    let studentId = code;
    try {
      const parsed = JSON.parse(decodeURIComponent(code));
      if (parsed.id) studentId = parsed.id;
    } catch {
      // code is already a plain student ID
    }

    const borrower = await Borrower.findOne({ studentId: studentId.toUpperCase() });
    if (!borrower) {
      throw new AppError(`No borrower found with ID: ${studentId}`, 404);
    }

    res.json({
      success: true,
      data: borrower,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single borrower by student ID
 * @route   GET /api/borrowers/:id
 */
export const getBorrowerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let borrower = await Borrower.findOne({ studentId: id.toUpperCase() });
    if (!borrower) {
      borrower = await Borrower.findById(id).catch(() => null);
    }
    if (!borrower) {
      throw new AppError(`Borrower not found: ${id}`, 404);
    }

    res.json({
      success: true,
      data: borrower,
    });
  } catch (error) {
    next(error);
  }
};

export default { createBorrower, getBorrowers, verifyBorrowerQR, getBorrowerById };
