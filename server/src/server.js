import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { User } from './models/index.js';
import { seedDatabase } from './seed/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function start() {
  console.log('SUNRISE Backend');
  const { memory } = await connectDB();

  // Auto-seed on first run so the demo works out of the box.
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Empty database — seeding demo data...');
    await seedDatabase();
  } else {
    console.log(`Database already seeded (${userCount} users).`);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    if (memory) {
      console.log('Note: using in-memory MongoDB (no local MongoDB found). Data resets on restart.');
    }
  });

  // Give a clear message instead of a raw stack trace when the port is taken
  // (e.g. another `npm run dev` is already running).
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} is already in use — another SUNRISE server is probably running.`);
      console.error(`Choose one:`);
      console.error(`  1. Use the server that is already running (skip this command).`);
      console.error(`  2. Stop the other instance first, then retry.`);
      console.error(`  3. Run on a different port:  PORT=${PORT + 1} npm run dev`);
      process.exit(1);
    }
    throw err;
  });

  const shutdown = async () => {
    console.log('\nShutting down...');
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
