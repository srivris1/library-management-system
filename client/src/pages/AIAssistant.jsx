import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Search, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import { aiAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `🤖 Hello! I'm your AI Library Assistant.\n\nI can help you with:\n• 📚 **Smart Search** — "Find available books on machine learning"\n• 📊 **Library Stats** — "How many books are overdue?"\n• 💡 **Recommendations** — "Recommend books for a CS student"\n• 🔍 **Book Availability** — "Is Atomic Habits available?"\n• 📂 **Categories** — "What categories do we have?"\n\nJust type your question below!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [smartSearchResults, setSmartSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await aiAPI.chat(userMessage);
      setMessages((prev) => [...prev, { role: 'bot', content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', content: `❌ Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSmartSearchResults(null);

    try {
      const res = await aiAPI.smartSearch(searchQuery);
      setSmartSearchResults(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const quickPrompts = [
    'How many books are in the library?',
    'Show overdue books',
    'Find available computer science books',
    'What categories do we have?',
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={28} style={{ color: 'var(--accent-primary)' }} />
          AI Library Assistant
        </h1>
        <p className="page-subtitle">Natural language search, recommendations, and library insights powered by AI</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Chat Panel */}
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="chat-message bot" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div style={{ padding: '8px 20px 0', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                className="filter-chip"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => { setInput(prompt); }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form className="chat-input-bar" onSubmit={handleSend}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about the library..."
              disabled={loading}
            />
            <button className="btn btn-primary btn-icon" type="submit" disabled={loading || !input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>

        {/* Smart Search Panel */}
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} style={{ color: 'var(--accent-primary)' }} />
              Smart Book Search
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Search using natural language. Try: "Available fiction books", "Books by James Clear", or "Data structures textbooks in stock"
            </p>
            <form onSubmit={handleSmartSearch} style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Describe what you're looking for..."
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" type="submit" disabled={searchLoading}>
                {searchLoading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : <Search size={16} />}
                Search
              </button>
            </form>
          </div>

          {/* Search Results */}
          {smartSearchResults && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                  Results ({smartSearchResults.data?.length || 0})
                </h3>
                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', border: '1px solid var(--border-accent)' }}>
                  {smartSearchResults.meta?.searchMethod}
                </span>
              </div>
              {smartSearchResults.meta?.interpretation && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontStyle: 'italic' }}>
                  💡 {smartSearchResults.meta.interpretation}
                </p>
              )}
              {smartSearchResults.data?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {smartSearchResults.data.map((book) => (
                    <div
                      key={book._id}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '15px' }}>{book.title}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            by {book.author} | {book.bookId}
                          </div>
                        </div>
                        <span className={`badge ${book.availableCopies > 0 ? 'badge-available' : 'badge-overdue'}`}>
                          {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Out of stock'}
                        </span>
                      </div>
                      <div style={{ marginTop: '6px' }}>
                        <span className="book-card-category">{book.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <BookOpen size={40} />
                  <h3>No results found</h3>
                  <p>Try a different search query.</p>
                </div>
              )}
            </div>
          )}

          {/* AI Features Info */}
          {!smartSearchResults && (
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={18} style={{ color: 'var(--warning)' }} />
                AI Features
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: '🔍', title: 'Natural Language Search', desc: 'Search books using everyday language instead of exact keywords' },
                  { icon: '🤖', title: 'Auto-Categorization', desc: 'AI suggests the best category when adding new books' },
                  { icon: '💡', title: 'Book Recommendations', desc: 'Get personalized suggestions based on borrowing history' },
                  { icon: '💬', title: 'Chat Assistant', desc: 'Ask questions about library stats, overdue books, and more' },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    style={{
                      display: 'flex', gap: '12px', padding: '12px',
                      background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{feature.icon}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{feature.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
