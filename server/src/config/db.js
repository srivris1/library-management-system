import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB.
 * - If MONGODB_URI is provided, uses that (Atlas or local Mongo).
 * - If MONGODB_URI is empty/missing, spins up an in-memory MongoDB server
 *   using mongodb-memory-server for zero-config local evaluation.
 */
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('⚡️ Using existing MongoDB connection');
    return;
  }

  let uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.log('⚠️  No MONGODB_URI found. Starting in-memory MongoDB server...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongodOptions = {
        instance: {
          dbName: 'libraryDB',
        },
        binary: {
          version: process.env.MONGOMS_VERSION || '7.0.0',
        },
      };
      const mongoServer = await MongoMemoryServer.create(mongodOptions);
      uri = mongoServer.getUri();
      console.log(`✅ In-memory MongoDB started at: ${uri}`);

      // Graceful shutdown
      const shutdown = async () => {
        await mongoServer.stop();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (memErr) {
      console.error('❌ Failed to start in-memory MongoDB:', memErr.message);
      console.error('   Please set MONGODB_URI environment variable to a MongoDB connection string.');
      process.exit(1);
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 8 doesn't require useNewUrlParser / useUnifiedTopology
    });
    isConnected = conn.connection.readyState === 1;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
