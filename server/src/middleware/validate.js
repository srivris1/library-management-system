import { z } from 'zod';

/**
 * Zod validation middleware factory.
 * Validates request body, query, or params against a Zod schema.
 *
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Which part of the request to validate
 * @returns Express middleware function
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }
      // Replace request data with parsed (and transformed) data
      req[source] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// ==================== Validation Schemas ====================

export const bookSchemas = {
  create: z.object({
    bookId: z
      .string()
      .min(1, 'Book ID is required')
      .max(50, 'Book ID must be under 50 characters')
      .transform((val) => val.trim().toUpperCase()),
    title: z
      .string()
      .min(1, 'Title is required')
      .max(300, 'Title must be under 300 characters')
      .transform((val) => val.trim()),
    author: z
      .string()
      .min(1, 'Author is required')
      .max(200, 'Author must be under 200 characters')
      .transform((val) => val.trim()),
    isbn: z.string().max(20).optional().default(''),
    category: z.string().min(1, 'Category is required'),
    description: z.string().max(2000).optional().default(''),
    totalCopies: z.number().int().min(1, 'At least 1 copy required').optional().default(1),
    coverImage: z.string().url().optional().or(z.literal('')).default(''),
  }),

  update: z.object({
    title: z.string().min(1).max(300).optional(),
    author: z.string().min(1).max(200).optional(),
    isbn: z.string().max(20).optional(),
    category: z.string().optional(),
    description: z.string().max(2000).optional(),
    totalCopies: z.number().int().min(1).optional(),
    coverImage: z.string().url().optional().or(z.literal('')),
  }),
};

export const transactionSchemas = {
  issue: z.object({
    bookId: z
      .string()
      .min(1, 'Book ID is required')
      .transform((val) => val.trim().toUpperCase()),
    borrower: z.object({
      studentId: z
        .string()
        .min(1, 'Student ID is required')
        .transform((val) => val.trim().toUpperCase()),
      name: z
        .string()
        .min(1, 'Borrower name is required')
        .transform((val) => val.trim()),
      email: z.string().email().optional().or(z.literal('')).default(''),
      phone: z.string().max(15).optional().default(''),
    }),
    loanDays: z.number().int().min(1).max(365).optional(),
  }),

  return: z.object({
    bookId: z
      .string()
      .min(1, 'Book ID is required')
      .transform((val) => val.trim().toUpperCase()),
    studentId: z
      .string()
      .min(1, 'Student ID is required')
      .transform((val) => val.trim().toUpperCase()),
  }),
};

export const borrowerSchemas = {
  create: z.object({
    studentId: z
      .string()
      .min(1, 'Student ID is required')
      .transform((val) => val.trim().toUpperCase()),
    name: z.string().min(1, 'Name is required').transform((val) => val.trim()),
    email: z.string().email().optional().or(z.literal('')).default(''),
    phone: z.string().max(15).optional().default(''),
    department: z.string().max(100).optional().default(''),
    year: z.number().int().min(1).max(5).optional().default(1),
  }),
};

export default { validate, bookSchemas, transactionSchemas, borrowerSchemas };
