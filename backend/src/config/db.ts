import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;

  const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/npc_db';
  try {
    const conn = await mongoose.connect(connStr, { serverSelectionTimeoutMS: 10000 });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database] Primary MongoDB connection failed (${(error as Error).message}). Falling back to In-Memory MongoDB for local execution.`);
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] In-Memory MongoDB Connected: ${conn.connection.host}`);
  }
};

