import { useState, useEffect } from 'react';
import { Search, RefreshCw, History, Filter } from 'lucide-react';
import { transactionAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await transactionAPI.getAll({
        search,
        status: statusFilter,
        page,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setTransactions(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, statusFilter, page]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusBadge = (t) => {
    const status = t.status;
    if (status === 'OVERDUE') return <span className="badge badge-overdue">⏰ Overdue ({t.overdueDays}d)</span>;
    if (status === 'ISSUED') return <span className="badge badge-issued">📤 Issued</span>;
    if (status === 'RETURNED') return <span className="badge badge-returned">✅ Returned</span>;
    return <span className="badge">{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transaction History</h1>
        <p className="page-subtitle">Complete log of all book issues and returns</p>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <Search size={18} />
            <input
              placeholder="Search by book, student, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary btn-sm" onClick={fetchTransactions}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="filters-bar">
        {['', 'ISSUED', 'RETURNED'].map((s) => (
          <button
            key={s}
            className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s === '' ? 'All' : s === 'ISSUED' ? '📤 Issued / Overdue' : '✅ Returned'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <History size={64} />
          <h3>No transactions</h3>
          <p>Issue or return a book to see transactions here.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.bookTitle}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.bookId}</div>
                    </td>
                    <td>
                      <div>{t.borrower?.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.borrower?.studentId}</div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{formatDate(t.issueDate)}</td>
                    <td style={{ fontSize: '13px' }}>{formatDate(t.dueDate)}</td>
                    <td style={{ fontSize: '13px' }}>{formatDate(t.returnDate)}</td>
                    <td>{getStatusBadge(t)}</td>
                    <td>
                      {(t.fineAmount > 0 || t.currentFine > 0) ? (
                        <span style={{ fontWeight: '600', color: 'var(--danger)' }}>
                          ₹{t.fineAmount || t.currentFine}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
              <span className="pagination-info">Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasMore}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
