import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard,
  BookOpen,
  ScanLine,
  History,
  BarChart3,
  Bot,
  Users,
  Menu,
  X,
  Library,
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Scanner from './pages/Scanner';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import Borrowers from './pages/Borrowers';

import './index.css';

function Sidebar({ isOpen, onClose, overdueCount }) {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Book Catalog', icon: BookOpen, path: '/books' },
    { label: 'QR Scanner', icon: ScanLine, path: '/scanner' },
    { label: 'Transactions', icon: History, path: '/transactions', badge: overdueCount },
    { label: 'Reports & Export', icon: BarChart3, path: '/reports' },
    { label: 'Borrowers', icon: Users, path: '/borrowers' },
  ];

  const aiItems = [
    { label: 'AI Assistant', icon: Bot, path: '/ai' },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Library size={22} />
            </div>
            <div>
              <div className="sidebar-logo-text">LibraryOS</div>
              <div className="sidebar-logo-sub">Management System</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Main</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive || (item.path === '/' && location.pathname === '/') ? 'active' : ''}`
              }
              end={item.path === '/'}
              onClick={onClose}
            >
              <item.icon size={20} />
              {item.label}
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}

          <div className="sidebar-section-title">AI Features</div>
          {aiItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  return (
    <Router>
      <div className="app-layout">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          overdueCount={overdueCount}
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard onOverdueCount={setOverdueCount} />} />
            <Route path="/books" element={<Books />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="/borrowers" element={<Borrowers />} />
          </Routes>
        </main>

        <Toaster
          position="top-right"
          toastOptions={{
            className: 'toast-custom',
            duration: 4000,
          }}
        />
      </div>
    </Router>
  );
}

export default App;
