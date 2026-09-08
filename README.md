# 📚 LibraryOS — Library Book Issue & Return Management System

A production-grade, full-stack web application for managing library book issues, returns, and tracking using QR code scanning. Built with **React**, **Node.js/Express**, and **MongoDB**.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-v18+-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)

---

## 🚀 Features

### Core Features
- **📖 Book Management** — Add, edit, delete books with metadata (Title, Author, ISBN, Category, Copies)
- **🔲 QR Code Generation** — Auto-generates unique QR codes for every book on creation
- **📷 QR Code Scanning** — Scan books via webcam, file upload, or manual entry using `html5-qrcode`
- **📤 Issue & Return** — Issue and return books with real-time stock management
- **🔍 Search & Filter** — Search books by title, author, category, availability with pagination
- **✅ Validation & Error Handling** — Zod schema validation on all inputs, centralized error handling
- **🛡️ Concurrency Protection** — Atomic MongoDB operations prevent race conditions on stock

### Admin Dashboard (Brownie Subtask ⭐)
- **📊 Real-time Statistics** — Total books, available copies, issued, overdue count
- **📋 Overdue Books Table** — Lists all overdue books with borrower details and accumulated fines
- **🔎 Transaction Filters** — Search and filter transactions by status, date, book, or borrower
- **📥 Downloadable Reports** — Export complete issue/return history as CSV or Excel (.xlsx)
- **📅 Overdue Days Calculation** — Dynamic calculation of days overdue with ₹5/day fine engine
- **📈 Category Distribution** — Visual bar chart of books per category
- **🏆 Popular Books & Top Borrowers** — Rankings by issue count

### AI-Powered Features (Optional Bonus 🤖)
- **🧠 Smart Natural Language Search** — Type "find available CS books about algorithms" and get accurate results
- **🤖 Auto-Categorization** — AI suggests the best category when adding new books
- **💬 Library Chat Assistant** — Ask questions like "How many books are overdue?" and get instant answers
- **💡 Book Recommendations** — Personalized suggestions based on borrowing history (category-affinity algorithm)
- **🔌 Dual Mode** — Works offline with keyword NLP; optionally connects to Google Gemini API for richer understanding

### Bonus Engineering Features
- **👤 Student Library Pass System** — Register students, generate library pass QR codes, scan student QR to auto-fill borrower details
- **📊 Styled Excel Reports** — Color-coded status cells, formatted headers, auto-filter columns
- **🔊 Audio Feedback** — Beep confirmation on successful QR scan
- **📱 Responsive Design** — Works on desktop, tablet, and mobile
- **🌙 Dark Theme** — Premium dark glassmorphism UI with smooth animations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                 │
│  ┌──────────┬──────────┬─────────┬──────────┬─────────────┐ │
│  │Dashboard │ Catalog  │ Scanner │ History  │ AI Assistant │ │
│  └────┬─────┴────┬─────┴────┬────┴────┬─────┴──────┬──────┘ │
│       └──────────┴──────────┴─────────┴────────────┘        │
│                         Axios API Client                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (JSON)
┌──────────────────────────┴──────────────────────────────────┐
│                   Backend (Node.js + Express)                │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌────────┐ │
│  │   Books    │ │ Transactions │ │  Reports   │ │   AI   │ │
│  │ Controller │ │  Controller  │ │ Controller │ │ Engine │ │
│  └─────┬──────┘ └──────┬───────┘ └─────┬──────┘ └───┬────┘ │
│        └───────────────┬───────────────┘             │      │
│                   Mongoose ODM                       │      │
│                        │                    Gemini API (opt) │
└────────────────────────┴────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │   MongoDB Database  │
              │  (Atlas / Local /   │
              │   In-Memory)        │
              └─────────────────────┘
```

---

## 📋 API Documentation

### Books

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/books` | Create a new book (auto-generates QR) |
| `GET` | `/api/books` | List books with search, filter, pagination |
| `GET` | `/api/books/:id` | Get single book details |
| `PUT` | `/api/books/:id` | Update book metadata |
| `DELETE` | `/api/books/:id` | Delete book (only if no copies issued) |
| `GET` | `/api/books/verify/:code` | Verify scanned QR code |
| `GET` | `/api/books/categories` | Get all unique categories |
| `POST` | `/api/books/:id/regenerate-qr` | Regenerate QR code |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/transactions/issue` | Issue a book (atomic stock decrement) |
| `POST` | `/api/transactions/return` | Return a book (atomic stock increment + fine calc) |
| `GET` | `/api/transactions` | List transactions with filters & pagination |
| `GET` | `/api/transactions/overdue` | Get all overdue transactions |
| `GET` | `/api/transactions/:id` | Get single transaction |

### Dashboard & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Admin dashboard statistics |
| `GET` | `/api/reports/export/csv` | Download CSV report |
| `GET` | `/api/reports/export/excel` | Download Excel report |

### AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/smart-search` | Natural language book search |
| `POST` | `/api/ai/recommend` | Book recommendations by student |
| `POST` | `/api/ai/categorize` | Auto-categorize a book |
| `POST` | `/api/ai/chat` | Chat with the library assistant |

### Borrowers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/borrowers` | Register a new borrower |
| `GET` | `/api/borrowers` | List all borrowers |
| `GET` | `/api/borrowers/verify/:code` | Verify student QR |

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js v18+ and npm
- MongoDB (Atlas cloud, local installation, OR leave empty for auto in-memory mode)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/library-management-system.git
cd library-management-system
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env if you want to connect to MongoDB Atlas
# Leave MONGODB_URI empty for automatic in-memory database
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```

### 4. Seed Sample Data (Optional)
```bash
cd ../server
npm run seed
```
This creates 15 sample books, 5 borrowers, and 4 sample transactions (including overdue ones).

### 5. Run the Application
Open two terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server runs at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App runs at http://localhost:5173
```

### 6. (Optional) Enable AI Features
To use Gemini-powered AI search, add your API key to `server/.env`:
```env
GEMINI_API_KEY=your-api-key-here
```
The AI features work without this key too — they use an offline NLP engine.

---

## 🏛️ Implementation Decisions

### Why MongoDB over PostgreSQL?
- Schema flexibility for rapid prototyping (books may have varying metadata)
- Mongoose virtuals for computed fields (status, overdueDays) without stored procedures
- Native JSON handling matches the REST API responses perfectly
- `mongodb-memory-server` enables zero-config evaluation — no database installation needed

### Why Atomic Operations for Stock Management?
Using `findOneAndUpdate` with `$inc` and conditional filters (`availableCopies > 0`) prevents race conditions where two librarians could issue the last copy simultaneously. This is a critical correctness guarantee.

### Why Offline + Online AI?
The offline NLP engine (keyword extraction + pattern matching) ensures the app works fully without any external API dependency. The optional Gemini integration adds richer natural language understanding when an API key is available. This dual-mode approach is production-ready.

### Why QR Codes as Data URLs?
Storing QR codes as Base64 data URLs in MongoDB eliminates the need for a separate file storage system (S3, file system). This simplifies deployment and ensures QR codes are always available instantly.

---

## 📝 Concepts Learned

- **Atomic Database Operations** — Using MongoDB's `$inc` with conditional filters for concurrency-safe stock management
- **QR Code Generation & Scanning** — Server-side QR generation with `qrcode` and client-side camera scanning with `html5-qrcode`
- **Input Validation** — Using Zod schemas for type-safe, declarative request validation with custom error messages
- **Report Generation** — Streaming CSV and styled Excel files using `exceljs` with formatted headers and conditional styling
- **NLP Search Engine** — Building a keyword-based natural language query parser that translates English sentences into database queries
- **RESTful API Design** — Consistent response formats, proper HTTP status codes, and error handling middleware
- **React State Management** — Managing complex UI state with hooks, API integration with Axios, and real-time updates

---

## 📂 Project Structure

```
├── server/                          # Node.js + Express backend
│   ├── src/
│   │   ├── config/db.js             # MongoDB connection (with in-memory fallback)
│   │   ├── models/
│   │   │   ├── Book.js              # Book schema with text indexes & virtual status
│   │   │   ├── Transaction.js       # Transaction schema with overdue virtuals
│   │   │   └── Borrower.js          # Student borrower profile schema
│   │   ├── controllers/
│   │   │   ├── bookController.js    # CRUD + QR generation + search
│   │   │   ├── transactionController.js  # Atomic issue/return + overdue
│   │   │   ├── dashboardController.js    # Admin statistics aggregation
│   │   │   ├── reportController.js  # CSV & Excel report generation
│   │   │   ├── aiController.js      # Smart search + chat + categorize
│   │   │   └── borrowerController.js # Student pass management
│   │   ├── routes/                  # Express route definitions
│   │   ├── middleware/
│   │   │   ├── validate.js          # Zod validation middleware
│   │   │   └── errorHandler.js      # Centralized error handling
│   │   ├── utils/
│   │   │   ├── qrGenerator.js       # QR code generation utility
│   │   │   └── seedData.js          # Database seeding script
│   │   └── server.js                # Express app entry point
│   ├── .env.example
│   └── package.json
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Admin dashboard with stats & charts
│   │   │   ├── Books.jsx            # Book catalog with add/view/delete
│   │   │   ├── Scanner.jsx          # QR scanner (camera/manual/file)
│   │   │   ├── Transactions.jsx     # Transaction history table
│   │   │   ├── Reports.jsx          # CSV/Excel export interface
│   │   │   ├── AIAssistant.jsx      # AI chat + smart search
│   │   │   └── Borrowers.jsx        # Student pass management
│   │   ├── services/api.js          # Axios API client
│   │   ├── App.jsx                  # Routing + sidebar layout
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Complete design system
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 📜 License

This project was built as part of the Newton School Coding Club (SRM IST) 2nd Year recruitment task.
