import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      required: [true, 'Book ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      index: true,
    },
    isbn: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: [
          'Computer Science',
          'Mathematics',
          'Physics',
          'Chemistry',
          'Biology',
          'Engineering',
          'Literature',
          'History',
          'Philosophy',
          'Economics',
          'Business',
          'Psychology',
          'Art',
          'Music',
          'Fiction',
          'Non-Fiction',
          'Reference',
          'Self-Help',
          'Other',
        ],
        message: '{VALUE} is not a valid category',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    totalCopies: {
      type: Number,
      required: true,
      min: [1, 'Total copies must be at least 1'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative'],
      default: 1,
    },
    qrCodeDataUrl: {
      type: String,
      default: '',
    },
    coverImage: {
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

// Virtual: status derived from availableCopies
bookSchema.virtual('status').get(function () {
  if (this.availableCopies === 0) return 'OUT_OF_STOCK';
  if (this.availableCopies < this.totalCopies) return 'PARTIALLY_AVAILABLE';
  return 'AVAILABLE';
});

// Text index for full-text search
bookSchema.index({ title: 'text', author: 'text', description: 'text', category: 'text' });

const Book = mongoose.model('Book', bookSchema);

export default Book;
