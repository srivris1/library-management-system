import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Filter, BarChart3 } from 'lucide-react';
import { reportAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Reports() {
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleExportCSV = () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      reportAPI.exportCSV(params);
      toast.success('CSV download started');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExportExcel = () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      reportAPI.exportExcel(params);
      toast.success('Excel download started');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports & Export</h1>
        <p className="page-subtitle">Download issue/return reports as CSV or Excel files</p>
      </div>

      {/* Export Options */}
      <div className="card" style={{ maxWidth: '700px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} /> Filter Report Data
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Transactions</option>
              <option value="ISSUED">Currently Issued</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">From Date</label>
            <input className="form-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To Date</label>
            <input className="form-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxWidth: '700px' }}>
        {/* CSV Export */}
        <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={handleExportCSV}>
          <div style={{
            width: '64px', height: '64px', borderRadius: 'var(--radius-lg)',
            background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <FileText size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Export as CSV</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Download a comma-separated values file. Compatible with Excel, Google Sheets, and any data tool.
          </p>
          <span style={{ fontSize: '13px', color: 'var(--success)', fontWeight: '600' }}>
            Includes: Book Title, Author, Book ID, Borrower, Issue/Return dates, Status, Fines
          </span>
        </div>

        {/* Excel Export */}
        <div className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={handleExportExcel}>
          <div style={{
            width: '64px', height: '64px', borderRadius: 'var(--radius-lg)',
            background: 'rgba(59, 130, 246, 0.15)', color: 'var(--info)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <FileSpreadsheet size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Export as Excel</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Download a styled .xlsx spreadsheet with formatted headers, color-coded status, and auto-filters.
          </p>
          <span style={{ fontSize: '13px', color: 'var(--info)', fontWeight: '600' }}>
            Includes styled headers, conditional formatting, and auto-filter columns
          </span>
        </div>
      </div>

      {/* Report Info */}
      <div className="card" style={{ marginTop: '24px', maxWidth: '700px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={18} style={{ color: 'var(--accent-primary)' }} />
          Report Fields
        </h3>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Book Title', 'Title of the book'],
                ['Author', 'Author of the book'],
                ['Book ID', 'Unique library identifier'],
                ['Issued To (Student ID)', 'Student\'s registration number'],
                ['Issued To (Name)', 'Borrower\'s full name'],
                ['Issue Timestamp', 'Date and time of issue'],
                ['Due Date', 'Expected return date'],
                ['Return Timestamp', 'Actual return date (N/A if not returned)'],
                ['Current Status', 'ISSUED / RETURNED / OVERDUE'],
                ['Overdue Days', 'Number of days past due date'],
                ['Fine Amount (₹)', 'Calculated fine based on overdue days'],
              ].map(([col, desc]) => (
                <tr key={col}>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{col}</td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
