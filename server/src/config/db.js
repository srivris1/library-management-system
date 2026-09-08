import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB.
 * - If MONGODB_URI is provided, uses that (Atlas or local Mongo).
 * - If MONGODB_URI is empty/missing, spins up an in-memory MongoDB server
 *   using mongodb-memory-server for zero-config local evaluation.
 */
const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.log('⚠️  No MONGODB_URI found. Starting in-memory MongoDB server...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    console.log(`✅ In-memory MongoDB started at: ${uri}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoServer.stop();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await mongoServer.stop();
      process.exit(0);
    });
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 8 doesn't require useNewUrlParser / useUnifiedTopology
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
