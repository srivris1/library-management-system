import { Router } from 'express';
import Book from '../models/Book.js';
import Transaction from '../models/Transaction.js';
import Borrower from '../models/Borrower.js';
import { generateQRCode } from '../utils/qrGenerator.js';

const router = Router();

/**
 * @desc    Seed the database with sample data via API
 * @route   POST /api/seed
 */
router.post('/', async (req, res, next) => {
  try {
    // Clear existing data
    await Book.deleteMany({});
    await Transaction.deleteMany({});
    await Borrower.deleteMany({});

    const sampleBooks = [
      { bookId: 'LIB-CS-001', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', category: 'Computer Science', description: 'A comprehensive textbook on algorithms, widely used as a university textbook.', totalCopies: 5 },
      { bookId: 'LIB-CS-002', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'Computer Science', description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.', totalCopies: 3 },
      { bookId: 'LIB-CS-003', title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Gang of Four', isbn: '978-0201633610', category: 'Computer Science', description: 'Capturing a wealth of experience about the design of object-oriented software.', totalCopies: 2 },
      { bookId: 'LIB-CS-004', title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', isbn: '978-0135957059', category: 'Computer Science', description: 'Your Journey to Mastery. One of the most significant books ever written about software development.', totalCopies: 4 },
      { bookId: 'LIB-CS-005', title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson, Gerald Jay Sussman', isbn: '978-0262510875', category: 'Computer Science', description: 'A classic MIT textbook on the foundations of computer science.', totalCopies: 2 },
      { bookId: 'LIB-MA-001', title: 'Calculus: Early Transcendentals', author: 'James Stewart', isbn: '978-1285741550', category: 'Mathematics', description: 'A widely used textbook for introductory calculus courses.', totalCopies: 6 },
      { bookId: 'LIB-MA-002', title: 'Linear Algebra and Its Applications', author: 'David C. Lay', isbn: '978-0321982384', category: 'Mathematics', description: 'An introductory treatment of linear algebra emphasizing applications.', totalCopies: 3 },
      { bookId: 'LIB-PH-001', title: 'Fundamentals of Physics', author: 'David Halliday, Robert Resnick', isbn: '978-1118230718', category: 'Physics', description: 'The gold standard physics textbook.', totalCopies: 4 },
      { bookId: 'LIB-PH-002', title: 'Quantum Mechanics: Concepts and Applications', author: 'Nouredine Zettili', isbn: '978-0470026793', category: 'Physics', description: 'An accessible introduction to quantum mechanics.', totalCopies: 2 },
      { bookId: 'LIB-EN-001', title: 'Engineering Mechanics: Statics', author: 'J.L. Meriam, L.G. Kraige', isbn: '978-1118807330', category: 'Engineering', description: 'The standard text for engineering statics courses.', totalCopies: 3 },
      { bookId: 'LIB-FI-001', title: '1984', author: 'George Orwell', isbn: '978-0451524935', category: 'Fiction', description: 'A dystopian novel about totalitarianism and surveillance.', totalCopies: 5 },
      { bookId: 'LIB-FI-002', title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0060935467', category: 'Fiction', description: 'A classic novel about racial inequality and moral growth.', totalCopies: 3 },
      { bookId: 'LIB-BU-001', title: 'The Lean Startup', author: 'Eric Ries', isbn: '978-0307887894', category: 'Business', description: 'How today\'s entrepreneurs use continuous innovation.', totalCopies: 2 },
      { bookId: 'LIB-PS-001', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '978-0374533557', category: 'Psychology', description: 'A groundbreaking tour of the mind exploring two systems of thought.', totalCopies: 3 },
      { bookId: 'LIB-SH-001', title: 'Atomic Habits', author: 'James Clear', isbn: '978-0735211292', category: 'Self-Help', description: 'An easy & proven way to build good habits & break bad ones.', totalCopies: 4 },
    ];

    const createdBooks = [];
    for (const bookData of sampleBooks) {
      const qrCodeDataUrl = await generateQRCode(bookData.bookId, 'BOOK');
      const book = await Book.create({ ...bookData, availableCopies: bookData.totalCopies, qrCodeDataUrl });
      createdBooks.push(book);
    }

    // Borrowers
    const borrowerData = [
      { studentId: 'STU001', name: 'Aarav Sharma', email: 'aarav@srm.edu', phone: '9876543210', department: 'Computer Science', year: 2 },
      { studentId: 'STU002', name: 'Priya Patel', email: 'priya@srm.edu', phone: '9876543211', department: 'Computer Science', year: 2 },
      { studentId: 'STU003', name: 'Rohit Kumar', email: 'rohit@srm.edu', phone: '9876543212', department: 'Mathematics', year: 3 },
      { studentId: 'STU004', name: 'Sneha Reddy', email: 'sneha@srm.edu', phone: '9876543213', department: 'Physics', year: 2 },
      { studentId: 'STU005', name: 'Vikram Singh', email: 'vikram@srm.edu', phone: '9876543214', department: 'Engineering', year: 1 },
    ];
    for (const b of borrowerData) {
      const qr = await generateQRCode(b.studentId, 'STUDENT');
      await Borrower.create({ ...b, qrCodeDataUrl: qr });
    }

    // Transactions
    const now = new Date();

    // Active issue (3 days ago)
    const d1 = new Date(now); d1.setDate(now.getDate() - 3);
    const dd1 = new Date(d1); dd1.setDate(d1.getDate() + 14);
    await Transaction.create({ book: createdBooks[0]._id, bookId: createdBooks[0].bookId, bookTitle: createdBooks[0].title, bookAuthor: createdBooks[0].author, borrower: { studentId: 'STU001', name: 'Aarav Sharma', email: 'aarav@srm.edu' }, issueDate: d1, dueDate: dd1, status: 'ISSUED' });
    await Book.findByIdAndUpdate(createdBooks[0]._id, { $inc: { availableCopies: -1 } });

    // Overdue (20 days ago)
    const d2 = new Date(now); d2.setDate(now.getDate() - 20);
    const dd2 = new Date(d2); dd2.setDate(d2.getDate() + 14);
    await Transaction.create({ book: createdBooks[1]._id, bookId: createdBooks[1].bookId, bookTitle: createdBooks[1].title, bookAuthor: createdBooks[1].author, borrower: { studentId: 'STU002', name: 'Priya Patel', email: 'priya@srm.edu' }, issueDate: d2, dueDate: dd2, status: 'ISSUED' });
    await Book.findByIdAndUpdate(createdBooks[1]._id, { $inc: { availableCopies: -1 } });

    // Returned
    const d3 = new Date(now); d3.setDate(now.getDate() - 10);
    const dd3 = new Date(d3); dd3.setDate(d3.getDate() + 14);
    const r3 = new Date(now); r3.setDate(now.getDate() - 2);
    await Transaction.create({ book: createdBooks[10]._id, bookId: createdBooks[10].bookId, bookTitle: createdBooks[10].title, bookAuthor: createdBooks[10].author, borrower: { studentId: 'STU003', name: 'Rohit Kumar', email: 'rohit@srm.edu' }, issueDate: d3, dueDate: dd3, returnDate: r3, status: 'RETURNED' });

    // Another overdue (25 days ago)
    const d4 = new Date(now); d4.setDate(now.getDate() - 25);
    const dd4 = new Date(d4); dd4.setDate(d4.getDate() + 14);
    await Transaction.create({ book: createdBooks[5]._id, bookId: createdBooks[5].bookId, bookTitle: createdBooks[5].title, bookAuthor: createdBooks[5].author, borrower: { studentId: 'STU004', name: 'Sneha Reddy', email: 'sneha@srm.edu' }, issueDate: d4, dueDate: dd4, status: 'ISSUED' });
    await Book.findByIdAndUpdate(createdBooks[5]._id, { $inc: { availableCopies: -1 } });

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      data: { books: createdBooks.length, borrowers: borrowerData.length, transactions: 4 },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
