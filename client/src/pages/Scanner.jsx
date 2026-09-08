import { useState, useEffect, useRef } from 'react';
import { ScanLine, Upload, Keyboard, CheckCircle2, AlertCircle, X, BookOpen, User } from 'lucide-react';
import { bookAPI, transactionAPI, borrowerAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Scanner() {
  const [mode, setMode] = useState('issue'); // 'issue' | 'return'
  const [inputMethod, setInputMethod] = useState('manual'); // 'camera' | 'manual' | 'file'
  const [scanResult, setScanResult] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Issue form
  const [issueForm, setIssueForm] = useState({
    bookId: '', studentId: '', name: '', email: '', phone: '',
  });

  // Return form
  const [returnForm, setReturnForm] = useState({ bookId: '', studentId: '' });

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Start/stop camera scanner
  const startScanner = async () => {
    if (scanning) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
          // Play beep sound
          try {
            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
          } catch { /* ignore audio errors */ }
        },
        () => { /* ignore scan errors */ }
      );

      setScanning(true);
    } catch (err) {
      toast.error('Camera access denied or not available. Use manual entry or file upload instead.');
      setInputMethod('manual');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch { /* ignore */ }
      setScanning(false);
    }
  };

  useEffect(() => {
    if (inputMethod === 'camera') {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [inputMethod]);

  const handleScanSuccess = (decodedText) => {
    let bookId = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.id) {
        bookId = parsed.id;
        if (parsed.type === 'STUDENT') {
          // Scanned a student QR
          if (mode === 'issue') {
            setIssueForm((prev) => ({ ...prev, studentId: parsed.id }));
            toast.success(`Student scanned: ${parsed.id}`);
            // Try to lookup borrower details
            lookupBorrower(parsed.id);
          } else {
            setReturnForm((prev) => ({ ...prev, studentId: parsed.id }));
            toast.success(`Student scanned: ${parsed.id}`);
          }
          return;
        }
      }
    } catch { /* plain text */ }

    // Book QR scanned
    setScanResult(bookId);
    if (mode === 'issue') {
      setIssueForm((prev) => ({ ...prev, bookId }));
    } else {
      setReturnForm((prev) => ({ ...prev, bookId }));
    }
    verifyBook(bookId);
  };

  const lookupBorrower = async (studentId) => {
    try {
      const res = await borrowerAPI.verify(studentId);
      if (res.data) {
        setIssueForm((prev) => ({
          ...prev,
          studentId: res.data.studentId,
          name: res.data.name,
          email: res.data.email || '',
          phone: res.data.phone || '',
        }));
      }
    } catch {
      // Borrower not registered, that's ok
    }
  };

  const verifyBook = async (bookId) => {
    try {
      const res = await bookAPI.verify(bookId);
      setBookData(res.data);
      toast.success(`Book found: ${res.data.title}`);
    } catch (err) {
      setBookData(null);
      toast.error(err.message);
    }
  };

  // File upload scanner
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-file-reader');
      const result = await scanner.scanFile(file, true);
      handleScanSuccess(result);
      scanner.clear();
    } catch (err) {
      toast.error('Could not read QR from file. Make sure it contains a valid QR code.');
    }
  };

  // Issue book
  const handleIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.bookId || !issueForm.studentId || !issueForm.name) {
      return toast.error('Book ID, Student ID, and Borrower Name are required');
    }
    setLoading(true);
    try {
      const res = await transactionAPI.issue({
        bookId: issueForm.bookId,
        borrower: {
          studentId: issueForm.studentId,
          name: issueForm.name,
          email: issueForm.email,
          phone: issueForm.phone,
        },
      });
      toast.success(res.message);
      setIssueForm({ bookId: '', studentId: '', name: '', email: '', phone: '' });
      setBookData(null);
      setScanResult(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Return book
  const handleReturn = async (e) => {
    e.preventDefault();
    if (!returnForm.bookId || !returnForm.studentId) {
      return toast.error('Book ID and Student ID are required');
    }
    setLoading(true);
    try {
      const res = await transactionAPI.return(returnForm);
      const msg = res.data.overdueDays > 0
        ? `${res.message} — ${res.data.overdueDays} days overdue, Fine: ₹${res.data.fineAmount}`
        : res.message;
      toast.success(msg);
      setReturnForm({ bookId: '', studentId: '' });
      setBookData(null);
      setScanResult(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">QR Scanner</h1>
        <p className="page-subtitle">Scan book or student QR codes to issue and return books</p>
      </div>

      {/* Mode Toggle */}
      <div className="scanner-mode-toggle">
        <button
          className={`scanner-mode-btn ${mode === 'issue' ? 'active' : ''}`}
          onClick={() => { setMode('issue'); setBookData(null); setScanResult(null); }}
        >
          📤 Issue Book
        </button>
        <button
          className={`scanner-mode-btn ${mode === 'return' ? 'active' : ''}`}
          onClick={() => { setMode('return'); setBookData(null); setScanResult(null); }}
        >
          📥 Return Book
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Left: Scanner / Input */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
            {mode === 'issue' ? '📤 Scan to Issue' : '📥 Scan to Return'}
          </h3>

          {/* Input Method Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button className={`btn btn-sm ${inputMethod === 'camera' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputMethod('camera')}>
              <ScanLine size={14} /> Camera
            </button>
            <button className={`btn btn-sm ${inputMethod === 'manual' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputMethod('manual')}>
              <Keyboard size={14} /> Manual
            </button>
            <button className={`btn btn-sm ${inputMethod === 'file' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setInputMethod('file')}>
              <Upload size={14} /> File
            </button>
          </div>

          {/* Camera Scanner */}
          {inputMethod === 'camera' && (
            <div>
              <div className="scanner-container">
                <div id="qr-reader" style={{ width: '100%' }}></div>
              </div>
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Point your camera at a Book or Student QR code
              </p>
            </div>
          )}

          {/* Manual Entry */}
          {inputMethod === 'manual' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Enter the Book ID manually, then click Verify.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="form-input"
                  placeholder="Enter Book ID (e.g. LIB-CS-001)"
                  value={mode === 'issue' ? issueForm.bookId : returnForm.bookId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (mode === 'issue') setIssueForm((p) => ({ ...p, bookId: val }));
                    else setReturnForm((p) => ({ ...p, bookId: val }));
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => verifyBook(mode === 'issue' ? issueForm.bookId : returnForm.bookId)}
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {/* File Upload */}
          {inputMethod === 'file' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Upload an image of a QR code to scan.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{
                  width: '100%',
                  padding: '20px',
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              />
              <div id="qr-file-reader" style={{ display: 'none' }}></div>
            </div>
          )}

          {/* Scanned Book Preview */}
          {bookData && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${bookData.canIssue ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {bookData.canIssue ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                ) : (
                  <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
                )}
                <span style={{ fontWeight: '700', fontSize: '15px' }}>
                  {bookData.canIssue ? 'Book Available' : 'No Copies Available'}
                </span>
              </div>
              <p style={{ fontWeight: '600' }}>{bookData.title}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                by {bookData.author} | {bookData.bookId} | {bookData.availableCopies}/{bookData.totalCopies} available
              </p>
            </div>
          )}
        </div>

        {/* Right: Form */}
        <div className="card">
          {mode === 'issue' ? (
            <form onSubmit={handleIssue}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} /> Issue Details
              </h3>
              <div className="form-group">
                <label className="form-label">Book ID *</label>
                <input className="form-input" value={issueForm.bookId} onChange={(e) => setIssueForm((p) => ({ ...p, bookId: e.target.value }))} placeholder="LIB-CS-001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Student ID *</label>
                <input className="form-input" value={issueForm.studentId} onChange={(e) => setIssueForm((p) => ({ ...p, studentId: e.target.value }))} placeholder="STU001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Borrower Name *</label>
                <input className="form-input" value={issueForm.name} onChange={(e) => setIssueForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={issueForm.email} onChange={(e) => setIssueForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@srm.edu" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={issueForm.phone} onChange={(e) => setIssueForm((p) => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                {loading ? <div className="spinner" /> : <>📤 Confirm Issue</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReturn}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> Return Details
              </h3>
              <div className="form-group">
                <label className="form-label">Book ID *</label>
                <input className="form-input" value={returnForm.bookId} onChange={(e) => setReturnForm((p) => ({ ...p, bookId: e.target.value }))} placeholder="LIB-CS-001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Student ID *</label>
                <input className="form-input" value={returnForm.studentId} onChange={(e) => setReturnForm((p) => ({ ...p, studentId: e.target.value }))} placeholder="STU001" required />
              </div>
              <div style={{
                padding: '12px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '20px', fontSize: '13px', color: 'var(--warning)',
              }}>
                ⚠️ If the book is overdue, a fine will be calculated automatically.
              </div>
              <button type="submit" className="btn btn-success btn-lg" disabled={loading} style={{ width: '100%' }}>
                {loading ? <div className="spinner" /> : <>📥 Confirm Return</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
