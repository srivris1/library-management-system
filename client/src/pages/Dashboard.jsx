import { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  IndianRupee,
  Users,
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard({ onOverdueCount }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      setStats(res.data);
      if (onOverdueCount) onOverdueCount(res.data.overview.overdueCount || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <BookOpen />
        <h3>No Data Yet</h3>
        <p>Start by adding books to the library.</p>
      </div>
    );
  }

  const { overview, categoryDistribution, recentActivity, topBorrowers, popularBooks, overdueBooks } = stats;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Library management overview and real-time statistics</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Books</h3>
            <div className="stat-value">{overview.totalBooks}</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {overview.totalCopies} total copies
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <h3>Available</h3>
            <div className="stat-value">{overview.availableCopies}</div>
            <span style={{ fontSize: '12px', color: 'var(--success)' }}>Ready to issue</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <h3>Issued</h3>
            <div className="stat-value">{overview.currentlyIssued}</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Currently out</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3>Overdue</h3>
            <div className="stat-value">{overview.overdueCount}</div>
            <span style={{ fontSize: '12px', color: 'var(--danger)' }}>
              {overview.overdueCount > 0 ? 'Action required!' : 'All clear'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>Transactions</h3>
            <div className="stat-value">{overview.totalTransactions}</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <h3>Fines Pending</h3>
            <div className="stat-value">₹{overview.totalFinesAccumulated || 0}</div>
            <span style={{ fontSize: '12px', color: 'var(--warning)' }}>Accumulated</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Overdue Alerts */}
        <div className="card" style={{ gridColumn: overdueBooks?.length > 0 ? 'span 1' : 'span 2' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
            Overdue Books
          </h3>
          {overdueBooks && overdueBooks.length > 0 ? (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrower</th>
                    <th>Days Overdue</th>
                    <th>Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueBooks.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.bookTitle}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.bookId}</div>
                      </td>
                      <td>
                        <div>{t.borrower.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.borrower.studentId}</div>
                      </td>
                      <td>
                        <span className="badge badge-overdue">{t.overdueDays} days</span>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--danger)' }}>
                        ₹{t.currentFine}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--success)' }} />
              <h3 style={{ color: 'var(--success)' }}>All Clear!</h3>
              <p>No overdue books at the moment.</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
            Recent Activity
          </h3>
          {recentActivity && recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentActivity.map((t) => (
                <div
                  key={t._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {t.bookTitle}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t.borrower?.name} ({t.borrower?.studentId})
                    </div>
                  </div>
                  <span className={`badge badge-${t.status?.toLowerCase()}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No activity yet.</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Category Distribution */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
            📂 Categories
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categoryDistribution?.map((cat) => {
              const maxCount = Math.max(...categoryDistribution.map((c) => c.count));
              const percentage = (cat.count / maxCount) * 100;
              return (
                <div key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '130px' }}>
                    {cat._id}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '8px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'var(--accent-gradient)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', minWidth: '30px' }}>
                    {cat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Popular Books */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
            Most Issued Books
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {popularBooks?.map((b, i) => (
              <div
                key={b._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: i < 3 ? 'var(--accent-gradient)' : 'var(--bg-card)',
                    color: i < 3 ? 'white' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{b.title}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{b.issueCount} issues</span>
              </div>
            ))}
            {(!popularBooks || popularBooks.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
