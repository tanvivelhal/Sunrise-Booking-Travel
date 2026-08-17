import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

dotenv.config();

/**
 * Connect to MongoDB.
 *
 * 1. Uses MONGO_URI (local MongoDB) when reachable.
 * 2. Otherwise starts an in-memory MongoDB fallback so the project runs
 *    anywhere without a MongoDB install. The fallback:
 *      - uses the `ephemeralForTest` storage engine (no journal files →
 *        avoids failures on small RAM-backed /tmp filesystems), and
 *      - keeps its data directory on the real disk inside the project
 *        (never the OS tmp dir, which can be a tiny tmpfs).
 */

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const localDataRoot = path.join(projectRoot, '.mongo-data');

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/sunrise_travel';
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected successfully');
    console.log(`  → ${uri}`);
    return { memory: false };
  } catch (err) {
    return startMemoryServer();
  }
}

async function startMemoryServer() {
  console.warn('Local MongoDB not reachable — starting in-memory MongoDB (first run downloads a binary)...');
  mkdirSync(localDataRoot, { recursive: true });

  const { MongoMemoryServer } = await import('mongodb-memory-server');

  // Retry with a fresh data directory: a previous crash can leave a stale
  // lock file, and a brand-new directory always avoids it.
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const dbPath = path.join(localDataRoot, `data-${Date.now()}`);
    mkdirSync(dbPath, { recursive: true });
    try {
      const mongod = await MongoMemoryServer.create({
        instance: { dbPath }, // on the real disk, never the OS tmp dir
      });
      const memUri = mongod.getUri('sunrise_travel');
      await mongoose.connect(memUri);
      console.log('MongoDB connected successfully (in-memory)');
      console.log(`  → ${memUri}`);
      console.log(`  → data directory: ${dbPath}`);
      return { memory: true, mongod };
    } catch (e) {
      lastError = e;
      console.warn(`  in-memory MongoDB attempt ${attempt + 1} failed, retrying…`);
    }
  }

  throw new Error(
    'Could not start any MongoDB. Options: (1) install and start MongoDB and set ' +
      'MONGO_URI in server/.env, or (2) free space where temporary files are stored. ' +
      `Last error: ${lastError?.message || 'unknown'}`
  );
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
