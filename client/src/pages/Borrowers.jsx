import { useState, useEffect } from 'react';
import { Plus, Search, Users, QrCode, X } from 'lucide-react';
import { borrowerAPI } from '../services/api';
import toast from 'react-hot-toast';

function AddBorrowerModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    studentId: '', name: '', email: '', phone: '', department: '', year: 1,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 1 : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await borrowerAPI.create(form);
      toast.success('Borrower registered successfully!');
      onSuccess();
      onClose();
      setForm({ studentId: '', name: '', email: '', phone: '', department: '', year: 1 });
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
          <h2 className="modal-title">Register New Borrower</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Student ID *</label>
                <input className="form-input" name="studentId" value={form.studentId} onChange={handleChange} placeholder="STU001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Full name" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="student@srm.edu" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" name="department" value={form.department} onChange={handleChange} placeholder="Computer Science" />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" type="number" name="year" value={form.year} onChange={handleChange} min="1" max="5" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : <Plus size={16} />}
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Borrowers() {
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);

  const fetchBorrowers = async () => {
    try {
      setLoading(true);
      const res = await borrowerAPI.getAll({ search });
      setBorrowers(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowers();
  }, [search]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Borrowers</h1>
        <p className="page-subtitle">Manage student library passes and profiles</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <Search size={18} />
            <input
              placeholder="Search by name, student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Register Borrower
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : borrowers.length === 0 ? (
        <div className="empty-state">
          <Users size={64} />
          <h3>No borrowers registered</h3>
          <p>Register students to generate library pass QR codes.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Year</th>
                <th>Library Pass QR</th>
              </tr>
            </thead>
            <tbody>
              {borrowers.map((b) => (
                <tr key={b._id}>
                  <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{b.studentId}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{b.name}</td>
                  <td>{b.email || '—'}</td>
                  <td>{b.department || '—'}</td>
                  <td>{b.year}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedQR(b)}>
                      <QrCode size={14} /> View QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddBorrowerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchBorrowers} />

      {/* QR Modal */}
      {selectedQR && (
        <div className="modal-overlay" onClick={() => setSelectedQR(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Library Pass — {selectedQR.name}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedQR(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="qr-display">
                {selectedQR.qrCodeDataUrl && (
                  <img src={selectedQR.qrCodeDataUrl} alt={`QR for ${selectedQR.studentId}`} />
                )}
              </div>
              <p style={{ fontSize: '16px', fontWeight: '700', marginTop: '12px' }}>{selectedQR.name}</p>
              <p style={{ fontSize: '14px', color: 'var(--accent-primary)' }}>{selectedQR.studentId}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {selectedQR.department} — Year {selectedQR.year}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Scan this QR code during book issue to auto-fill borrower details
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
