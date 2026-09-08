import app from '../server/src/server.js';
import connectDB from '../server/src/config/db.js';

// Vercel serverless functions require the database connection to be 
// established before handling the request, since the express app
// might not be doing it outside of startServer()
export default async function handler(req, res) {
  // Ensure database is connected
  await connectDB();
  
  // Delegate the request to the express app
  return app(req, res);
}
