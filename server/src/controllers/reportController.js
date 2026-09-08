import Transaction from '../models/Transaction.js';
import ExcelJS from 'exceljs';
import { AppError } from '../middleware/errorHandler.js';

const FINE_PER_DAY = parseInt(process.env.FINE_PER_DAY) || 5;

/**
 * @desc    Export transactions as CSV
 * @route   GET /api/reports/export/csv
 * @query   status, fromDate, toDate
 */
export const exportCSV = async (req, res, next) => {
  try {
    const { status = '', fromDate = '', toDate = '' } = req.query;

    const query = {};
    if (status) query.status = status.toUpperCase();
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) query.issueDate.$gte = new Date(fromDate);
      if (toDate) query.issueDate.$lte = new Date(toDate);
    }

    const transactions = await Transaction.find(query).sort({ issueDate: -1 });

    if (transactions.length === 0) {
      throw new AppError('No transactions found for the specified filters', 404);
    }

    const now = new Date();

    // Build CSV content
    const headers = [
      'Book Title',
      'Author',
      'Book ID',
      'Issued To (Student ID)',
      'Issued To (Name)',
      'Issue Timestamp',
      'Due Date',
      'Return Timestamp',
      'Current Status',
      'Overdue Days',
      'Fine Amount (₹)',
    ];

    const rows = transactions.map((t) => {
      let overdueDays = 0;
      let fine = t.fineAmount || 0;

      if (t.status === 'ISSUED' && now > t.dueDate) {
        overdueDays = Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24));
        fine = overdueDays * FINE_PER_DAY;
      } else if (t.status === 'RETURNED' && t.returnDate > t.dueDate) {
        overdueDays = Math.ceil((t.returnDate - t.dueDate) / (1000 * 60 * 60 * 24));
      }

      const displayStatus = t.status === 'ISSUED' && now > t.dueDate ? 'OVERDUE' : t.status;

      return [
        `"${t.bookTitle}"`,
        `"${t.bookAuthor}"`,
        t.bookId,
        t.borrower.studentId,
        `"${t.borrower.name}"`,
        t.issueDate.toISOString(),
        t.dueDate.toISOString(),
        t.returnDate ? t.returnDate.toISOString() : 'N/A',
        displayStatus,
        overdueDays,
        fine,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=library_report_${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export transactions as Excel (XLSX) with formatting
 * @route   GET /api/reports/export/excel
 * @query   status, fromDate, toDate
 */
export const exportExcel = async (req, res, next) => {
  try {
    const { status = '', fromDate = '', toDate = '' } = req.query;

    const query = {};
    if (status) query.status = status.toUpperCase();
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) query.issueDate.$gte = new Date(fromDate);
      if (toDate) query.issueDate.$lte = new Date(toDate);
    }

    const transactions = await Transaction.find(query).sort({ issueDate: -1 });

    if (transactions.length === 0) {
      throw new AppError('No transactions found for the specified filters', 404);
    }

    const now = new Date();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Library Management System';
    workbook.created = now;

    const sheet = workbook.addWorksheet('Issue/Return Report', {
      properties: { tabColor: { argb: '1a1a2e' } },
    });

    // Define columns with styling
    sheet.columns = [
      { header: 'Book Title', key: 'title', width: 35 },
      { header: 'Author', key: 'author', width: 25 },
      { header: 'Book ID', key: 'bookId', width: 15 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Borrower Name', key: 'borrowerName', width: 25 },
      { header: 'Issue Date', key: 'issueDate', width: 22 },
      { header: 'Due Date', key: 'dueDate', width: 22 },
      { header: 'Return Date', key: 'returnDate', width: 22 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Overdue Days', key: 'overdueDays', width: 14 },
      { header: 'Fine (₹)', key: 'fine', width: 12 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1a1a2e' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    transactions.forEach((t) => {
      let overdueDays = 0;
      let fine = t.fineAmount || 0;

      if (t.status === 'ISSUED' && now > t.dueDate) {
        overdueDays = Math.ceil((now - t.dueDate) / (1000 * 60 * 60 * 24));
        fine = overdueDays * FINE_PER_DAY;
      } else if (t.status === 'RETURNED' && t.returnDate > t.dueDate) {
        overdueDays = Math.ceil((t.returnDate - t.dueDate) / (1000 * 60 * 60 * 24));
      }

      const displayStatus = t.status === 'ISSUED' && now > t.dueDate ? 'OVERDUE' : t.status;

      const row = sheet.addRow({
        title: t.bookTitle,
        author: t.bookAuthor,
        bookId: t.bookId,
        studentId: t.borrower.studentId,
        borrowerName: t.borrower.name,
        issueDate: t.issueDate.toISOString().replace('T', ' ').slice(0, 19),
        dueDate: t.dueDate.toISOString().replace('T', ' ').slice(0, 19),
        returnDate: t.returnDate
          ? t.returnDate.toISOString().replace('T', ' ').slice(0, 19)
          : 'N/A',
        status: displayStatus,
        overdueDays,
        fine,
      });

      // Color-code status
      const statusCell = row.getCell('status');
      if (displayStatus === 'OVERDUE') {
        statusCell.font = { color: { argb: 'FF0000' }, bold: true };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0' },
        };
      } else if (displayStatus === 'ISSUED') {
        statusCell.font = { color: { argb: 'FF8C00' }, bold: true };
      } else {
        statusCell.font = { color: { argb: '008000' }, bold: true };
      }
    });

    // Auto-filter
    sheet.autoFilter = {
      from: 'A1',
      to: `K${transactions.length + 1}`,
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=library_report_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

export default { exportCSV, exportExcel };
