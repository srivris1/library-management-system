import connectDB from '../config/db.js';
import Book from '../models/Book.js';
import Transaction from '../models/Transaction.js';
import Borrower from '../models/Borrower.js';
import { generateQRCode } from './qrGenerator.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleBooks = [
  {
    bookId: 'LIB-CS-001',
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    isbn: '978-0262033848',
    category: 'Computer Science',
    description: 'A comprehensive textbook on algorithms, widely used as a university textbook.',
    totalCopies: 5,
  },
  {
    bookId: 'LIB-CS-002',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Computer Science',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
    totalCopies: 3,
  },
  {
    bookId: 'LIB-CS-003',
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Gang of Four',
    isbn: '978-0201633610',
    category: 'Computer Science',
    description: 'Capturing a wealth of experience about the design of object-oriented software.',
    totalCopies: 2,
  },
  {
    bookId: 'LIB-CS-004',
    title: 'The Pragmatic Programmer',
    author: 'David Thomas, Andrew Hunt',
    isbn: '978-0135957059',
    category: 'Computer Science',
    description: 'Your Journey to Mastery. One of the most significant books ever written about software development.',
    totalCopies: 4,
  },
  {
    bookId: 'LIB-CS-005',
    title: 'Structure and Interpretation of Computer Programs',
    author: 'Harold Abelson, Gerald Jay Sussman',
    isbn: '978-0262510875',
    category: 'Computer Science',
    description: 'A classic MIT textbook on the foundations of computer science.',
    totalCopies: 2,
  },
  {
    bookId: 'LIB-MA-001',
    title: 'Calculus: Early Transcendentals',
    author: 'James Stewart',
    isbn: '978-1285741550',
    category: 'Mathematics',
    description: 'A widely used textbook for introductory calculus courses.',
    totalCopies: 6,
  },
  {
    bookId: 'LIB-MA-002',
    title: 'Linear Algebra and Its Applications',
    author: 'David C. Lay',
    isbn: '978-0321982384',
    category: 'Mathematics',
    description: 'An introductory treatment of linear algebra emphasizing applications.',
    totalCopies: 3,
  },
  {
    bookId: 'LIB-PH-001',
    title: 'Fundamentals of Physics',
    author: 'David Halliday, Robert Resnick',
    isbn: '978-1118230718',
    category: 'Physics',
    description: 'The gold standard physics textbook covering mechanics, thermodynamics, electromagnetism, and more.',
    totalCopies: 4,
  },
  {
    bookId: 'LIB-PH-002',
    title: 'Quantum Mechanics: Concepts and Applications',
    author: 'Nouredine Zettili',
    isbn: '978-0470026793',
    category: 'Physics',
    description: 'An accessible and comprehensive introduction to quantum mechanics.',
    totalCopies: 2,
  },
  {
    bookId: 'LIB-EN-001',
    title: 'Engineering Mechanics: Statics',
    author: 'J.L. Meriam, L.G. Kraige',
    isbn: '978-1118807330',
    category: 'Engineering',
    description: 'The standard text for engineering statics courses.',
    totalCopies: 3,
  },
  {
    bookId: 'LIB-FI-001',
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0451524935',
    category: 'Fiction',
    description: 'A dystopian novel about totalitarianism, surveillance, and the struggle for individual freedom.',
    totalCopies: 5,
  },
  {
    bookId: 'LIB-FI-002',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0060935467',
    category: 'Fiction',
    description: 'A classic novel about racial inequality and moral growth in the American South.',
    totalCopies: 3,
  },
  {
    bookId: 'LIB-BU-001',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    isbn: '978-0307887894',
    category: 'Business',
    description: 'How today\'s entrepreneurs use continuous innovation to create successful businesses.',
    totalCopies: 2,
  },
  {
    bookId: 'LIB-PS-001',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    isbn: '978-0374533557',
    category: 'Psychology',
    description: 'A groundbreaking tour of the mind exploring the two systems that drive the way we think.',
    totalCopies: 3,
  },
  {
    bookId: 'LIB-SH-001',
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '978-0735211292',
    category: 'Self-Help',
    description: 'An easy & proven way to build good habits & break bad ones.',
    totalCopies: 4,
  },
];

const sampleBorrowers = [
  { studentId: 'STU001', name: 'Aarav Sharma', email: 'aarav@srm.edu', phone: '9876543210', department: 'Computer Science', year: 2 },
  { studentId: 'STU002', name: 'Priya Patel', email: 'priya@srm.edu', phone: '9876543211', department: 'Computer Science', year: 2 },
  { studentId: 'STU003', name: 'Rohit Kumar', email: 'rohit@srm.edu', phone: '9876543212', department: 'Mathematics', year: 3 },
  { studentId: 'STU004', name: 'Sneha Reddy', email: 'sneha@srm.edu', phone: '9876543213', department: 'Physics', year: 2 },
  { studentId: 'STU005', name: 'Vikram Singh', email: 'vikram@srm.edu', phone: '9876543214', department: 'Engineering', year: 1 },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting database seed...\n');

    // Clear existing data
    await Book.deleteMany({});
    await Transaction.deleteMany({});
    await Borrower.deleteMany({});
    console.log('  ✓ Cleared existing data');

    // Seed books with QR codes
    const createdBooks = [];
    for (const bookData of sampleBooks) {
      const qrCodeDataUrl = await generateQRCode(bookData.bookId, 'BOOK');
      const book = await Book.create({
        ...bookData,
        availableCopies: bookData.totalCopies,
        qrCodeDataUrl,
      });
      createdBooks.push(book);
      console.log(`  ✓ Created book: ${book.title} (${book.bookId})`);
    }

    // Seed borrowers with QR codes
    const createdBorrowers = [];
    for (const bData of sampleBorrowers) {
      const qrCodeDataUrl = await generateQRCode(bData.studentId, 'STUDENT');
      const borrower = await Borrower.create({ ...bData, qrCodeDataUrl });
      createdBorrowers.push(borrower);
      console.log(`  ✓ Created borrower: ${borrower.name} (${borrower.studentId})`);
    }

    // Create some sample transactions (including some overdue)
    const now = new Date();

    // Normal issued book
    const issue1Date = new Date(now);
    issue1Date.setDate(now.getDate() - 3);
    const due1Date = new Date(issue1Date);
    due1Date.setDate(issue1Date.getDate() + 14);

    await Transaction.create({
      book: createdBooks[0]._id,
      bookId: createdBooks[0].bookId,
      bookTitle: createdBooks[0].title,
      bookAuthor: createdBooks[0].author,
      borrower: { studentId: 'STU001', name: 'Aarav Sharma', email: 'aarav@srm.edu' },
      issueDate: issue1Date,
      dueDate: due1Date,
      status: 'ISSUED',
    });
    await Book.findByIdAndUpdate(createdBooks[0]._id, { $inc: { availableCopies: -1 } });
    console.log('  ✓ Created transaction: STU001 -> Introduction to Algorithms (active)');

    // Overdue book (issued 20 days ago, due 14 days = 6 days overdue)
    const issue2Date = new Date(now);
    issue2Date.setDate(now.getDate() - 20);
    const due2Date = new Date(issue2Date);
    due2Date.setDate(issue2Date.getDate() + 14);

    await Transaction.create({
      book: createdBooks[1]._id,
      bookId: createdBooks[1].bookId,
      bookTitle: createdBooks[1].title,
      bookAuthor: createdBooks[1].author,
      borrower: { studentId: 'STU002', name: 'Priya Patel', email: 'priya@srm.edu' },
      issueDate: issue2Date,
      dueDate: due2Date,
      status: 'ISSUED',
    });
    await Book.findByIdAndUpdate(createdBooks[1]._id, { $inc: { availableCopies: -1 } });
    console.log('  ✓ Created transaction: STU002 -> Clean Code (OVERDUE - 6 days)');

    // Already returned book
    const issue3Date = new Date(now);
    issue3Date.setDate(now.getDate() - 10);
    const due3Date = new Date(issue3Date);
    due3Date.setDate(issue3Date.getDate() + 14);
    const return3Date = new Date(now);
    return3Date.setDate(now.getDate() - 2);

    await Transaction.create({
      book: createdBooks[10]._id,
      bookId: createdBooks[10].bookId,
      bookTitle: createdBooks[10].title,
      bookAuthor: createdBooks[10].author,
      borrower: { studentId: 'STU003', name: 'Rohit Kumar', email: 'rohit@srm.edu' },
      issueDate: issue3Date,
      dueDate: due3Date,
      returnDate: return3Date,
      status: 'RETURNED',
    });
    console.log('  ✓ Created transaction: STU003 -> 1984 (returned on time)');

    // Another overdue
    const issue4Date = new Date(now);
    issue4Date.setDate(now.getDate() - 25);
    const due4Date = new Date(issue4Date);
    due4Date.setDate(issue4Date.getDate() + 14);

    await Transaction.create({
      book: createdBooks[5]._id,
      bookId: createdBooks[5].bookId,
      bookTitle: createdBooks[5].title,
      bookAuthor: createdBooks[5].author,
      borrower: { studentId: 'STU004', name: 'Sneha Reddy', email: 'sneha@srm.edu' },
      issueDate: issue4Date,
      dueDate: due4Date,
      status: 'ISSUED',
    });
    await Book.findByIdAndUpdate(createdBooks[5]._id, { $inc: { availableCopies: -1 } });
    console.log('  ✓ Created transaction: STU004 -> Calculus (OVERDUE - 11 days)');

    console.log('\n✅ Database seeded successfully!');
    console.log(`   ${createdBooks.length} books created`);
    console.log(`   ${createdBorrowers.length} borrowers created`);
    console.log(`   4 sample transactions created (2 active, 1 returned, 2 overdue)\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedDatabase();
