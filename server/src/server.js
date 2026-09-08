import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Route imports
import bookRoutes from './routes/bookRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import borrowerRoutes from './routes/borrowerRoutes.js';
import seedRoutes from './routes/seedRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== Middleware ====================
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || '*', /\.vercel\.app$/]
    : '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Auto-connect to DB on incoming requests (serverless friendly)
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// ==================== API Routes ====================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Library Management API is running 📚',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/seed', seedRoutes);

// ==================== Error Handling ====================
app.use(notFoundHandler);
app.use(errorHandler);

// ==================== Start Server ====================
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(55));
      console.log('  📚 Library Management System API Server');
      console.log('='.repeat(55));
      console.log(`  🌐 Server:      http://localhost:${PORT}`);
      console.log(`  📡 API Base:     http://localhost:${PORT}/api`);
      console.log(`  🏥 Health:       http://localhost:${PORT}/api/health`);
      console.log(`  🌿 Environment:  ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(55) + '\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
