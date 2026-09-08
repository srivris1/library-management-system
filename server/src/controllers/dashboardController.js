import Book from '../models/Book.js';
import Transaction from '../models/Transaction.js';

const FINE_PER_DAY = parseInt(process.env.FINE_PER_DAY) || 5;

/**
 * @desc    Get dashboard statistics (Brownie Subtask: Admin Dashboard)
 * @route   GET /api/dashboard/stats
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // Aggregate book stats
    const bookStats = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
          totalAvailable: { $sum: '$availableCopies' },
          totalIssued: { $sum: { $subtract: ['$totalCopies', '$availableCopies'] } },
        },
      },
    ]);

    // Count overdue transactions
    const overdueCount = await Transaction.countDocuments({
      status: 'ISSUED',
      dueDate: { $lt: now },
    });

    // Count currently issued
    const issuedCount = await Transaction.countDocuments({
      status: 'ISSUED',
    });

    // Total transactions ever
    const totalTransactions = await Transaction.countDocuments();

    // Category distribution
    const categoryDistribution = await Book.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Recent activity (last 10 transactions)
    const recentActivity = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('bookTitle bookId borrower.name borrower.studentId status issueDate returnDate');

    // Top borrowers
    const topBorrowers = await Transaction.aggregate([
      {
        $group: {
          _id: '$borrower.studentId',
          name: { $first: '$borrower.name' },
          totalIssues: { $sum: 1 },
          currentlyIssued: {
            $sum: { $cond: [{ $eq: ['$status', 'ISSUED'] }, 1, 0] },
          },
        },
      },
      { $sort: { totalIssues: -1 } },
      { $limit: 10 },
    ]);

    // Most issued books
    const popularBooks = await Transaction.aggregate([
      {
        $group: {
          _id: '$bookId',
          title: { $first: '$bookTitle' },
          issueCount: { $sum: 1 },
        },
      },
      { $sort: { issueCount: -1 } },
      { $limit: 10 },
    ]);

    // Overdue books with fine details
    const overdueDetails = await Transaction.find({
      status: 'ISSUED',
      dueDate: { $lt: now },
    })
      .sort({ dueDate: 1 })
      .limit(20);

    const overdueWithFines = overdueDetails.map((t) => {
      const obj = t.toJSON();
      const diffMs = now - new Date(obj.dueDate);
      obj.overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      obj.currentFine = obj.overdueDays * FINE_PER_DAY;
      return obj;
    });

    const stats = bookStats[0] || {
      totalBooks: 0,
      totalCopies: 0,
      totalAvailable: 0,
      totalIssued: 0,
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalBooks: stats.totalBooks,
          totalCopies: stats.totalCopies,
          availableCopies: stats.totalAvailable,
          issuedCopies: stats.totalIssued,
          overdueCount,
          currentlyIssued: issuedCount,
          totalTransactions,
          totalFinesAccumulated: overdueWithFines.reduce((sum, t) => sum + t.currentFine, 0),
        },
        categoryDistribution,
        recentActivity,
        topBorrowers,
        popularBooks,
        overdueBooks: overdueWithFines,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getDashboardStats };
