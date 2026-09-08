import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
      index: true,
    },
    bookId: {
      type: String,
      required: true,
      index: true,
    },
    bookTitle: {
      type: String,
      required: true,
    },
    bookAuthor: {
      type: String,
      default: '',
    },
    borrower: {
      studentId: {
        type: String,
        required: [true, 'Student ID is required'],
        trim: true,
        index: true,
      },
      name: {
        type: String,
        required: [true, 'Borrower name is required'],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
      },
      phone: {
        type: String,
        trim: true,
        default: '',
      },
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ISSUED', 'RETURNED', 'OVERDUE'],
      default: 'ISSUED',
      index: true,
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: overdueDays - how many days past due
transactionSchema.virtual('overdueDays').get(function () {
  if (this.status === 'RETURNED') {
    // Calculate based on actual return date vs due date
    if (this.returnDate && this.returnDate > this.dueDate) {
      const diffMs = this.returnDate - this.dueDate;
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
    return 0;
  }
  // For currently issued books
  const now = new Date();
  if (now > this.dueDate) {
    const diffMs = now - this.dueDate;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual: isOverdue
transactionSchema.virtual('isOverdue').get(function () {
  if (this.status === 'RETURNED') return false;
  return new Date() > this.dueDate;
});

// Compound index for preventing duplicate active issues
transactionSchema.index({ book: 1, 'borrower.studentId': 1, status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
