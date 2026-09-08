import { useState, useEffect } from 'react';
import { Plus, Search, QrCode, Edit2, Trash2, Eye, RefreshCw, X } from 'lucide-react';
import { bookAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Engineering', 'Literature', 'History', 'Philosophy', 'Economics',
  'Business', 'Psychology', 'Art', 'Music', 'Fiction', 'Non-Fiction',
  'Reference', 'Self-Help', 'Other',
];

function AddBookModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    bookId: '', title: '', author: '', isbn: '', category: 'Computer Science',
    description: '', totalCopies: 1, coverImage: '',
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 1 : value }));
  };

  const handleAICategory = async () => {
    if (!form.title) return toast.error('Enter a title first');
    setAiLoading(true);
    try {
      const res = await aiAPI.categorize(form.title, form.description);
      if (res.data?.category) {
        setForm((prev) => ({ ...prev, category: res.data.category }));
        toast.success(`AI suggests: ${res.data.category} (${Math.round((res.data.confidence || 0) * 100)}% confidence)`);
      }
    } catch (err) {
      toast.error('AI categorization failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await bookAPI.create(form);
      toast.success('Book added successfully!');
      onSuccess();
      onClose();
      setForm({ bookId: '', title: '', author: '', isbn: '', category: 'Computer Science', description: '', totalCopies: 1, coverImage: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Book</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Book ID *</label>
                <input className="form-input" name="bookId" value={form.bookId} onChange={handleChange} placeholder="e.g. LIB-CS-001" required />
              </div>
              <div className="form-group">
                <label className="form-label">ISBN</label>
                <input className="form-input" name="isbn" value={form.isbn} onChange={handleChange} placeholder="978-0000000000" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="Book title" required />
            </div>
            <div className="form-group">
              <label className="form-label">Author *</label>
              <input className="form-input" name="author" value={form.author} onChange={handleChange} placeholder="Author name" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="form-select" name="category" value={form.category} onChange={handleChange} style={{ flex: 1 }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAICategory} disabled={aiLoading} title="Auto-categorize with AI">
                    {aiLoading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : '🤖'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Total Copies *</label>
                <input className="form-input" type="number" name="totalCopies" value={form.totalCopies} onChange={handleChange} min="1" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Brief description..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : <Plus size={16} />}
              Add Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookDetailModal({ book, isOpen, onClose }) {
  if (!isOpen || !book) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Book Details</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* QR Code */}
            <div className="qr-display">
              {book.qrCodeDataUrl && (
                <img src={book.qrCodeDataUrl} alt={`QR Code for ${book.bookId}`} />
              )}
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {book.bookId}
              </span>
            </div>
            {/* Details */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>{book.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>by {book.author}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Category</span>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{book.category}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ISBN</span>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{book.isbn || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Copies</span>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{book.totalCopies}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Available</span>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>
                    <span className={`badge badge-${book.availableCopies > 0 ? 'available' : 'overdue'}`}>
                      {book.availableCopies} / {book.totalCopies}
                    </span>
                  </p>
                </div>
              </div>

              {book.description && (
                <div style={{ marginTop: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Description</span>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.6' }}>
                    {book.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [categories, setCategories] = useState([]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await bookAPI.getAll({ search, category, availability, page, limit: 12 });
      setBooks(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await bookAPI.getCategories();
      setCategories(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, category, availability, page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (book) => {
    if (!confirm(`Delete "${book.title}" (${book.bookId})?`)) return;
    try {
      await bookAPI.delete(book.bookId);
      toast.success('Book deleted');
      fetchBooks();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Book Catalog</h1>
        <p className="page-subtitle">Manage your library collection</p>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by title, author, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="form-select"
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
            style={{ width: '160px' }}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary btn-sm" onClick={fetchBooks}><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16} /> Add Book</button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="filters-bar">
        <button
          className={`filter-chip ${category === '' ? 'active' : ''}`}
          onClick={() => { setCategory(''); setPage(1); }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${category === cat ? 'active' : ''}`}
            onClick={() => { setCategory(category === cat ? '' : cat); setPage(1); }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} />
          <h3>No books found</h3>
          <p>{search || category ? 'Try adjusting your search or filters.' : 'Start by adding books to your library.'}</p>
        </div>
      ) : (
        <>
          <div className="books-grid">
            {books.map((book) => (
              <div className="book-card" key={book._id}>
                <div className="book-card-header">
                  <span className="book-card-id">{book.bookId}</span>
                  <span className={`badge ${book.availableCopies > 0 ? (book.availableCopies < book.totalCopies ? 'badge-partial' : 'badge-available') : 'badge-overdue'}`}>
                    {book.availableCopies > 0 ? (book.availableCopies < book.totalCopies ? 'Partial' : 'Available') : 'Out of Stock'}
                  </span>
                </div>
                <h4 className="book-card-title">{book.title}</h4>
                <p className="book-card-author">by {book.author}</p>
                <div className="book-card-meta">
                  <span className="book-card-category">{book.category}</span>
                  <span className="book-card-stock">
                    {book.availableCopies}/{book.totalCopies} available
                  </span>
                </div>
                <div className="book-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedBook(book)}>
                    <Eye size={14} /> View
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedBook(book)} title="View QR">
                    <QrCode size={14} /> QR
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(book)}
                    style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasMore}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      <AddBookModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchBooks} />
      <BookDetailModal book={selectedBook} isOpen={!!selectedBook} onClose={() => setSelectedBook(null)} />
    </div>
  );
}
