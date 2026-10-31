import mongoose from 'mongoose';

// CRITICAL: fail fast, do not hang when database is disconnected or offline
mongoose.set('bufferCommands', false);

export interface DbStatus {
  connected: boolean;
  uriConfigured: boolean;
  databaseName?: string;
  host?: string;
  message: string;
  lastChecked: string;
}

let isConnected = false;
let connectionAttempted = false;
let lastError: string | null = null;

export async function initDatabase(): Promise<boolean> {
  connectionAttempted = true;
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim() === '') {
    lastError = 'MONGODB_URI environment variable is not defined.';
    console.warn('⚠️  [MongoDB Atlas] MONGODB_URI is not set. Persistent database requires a valid MongoDB Atlas connection string.');
    isConnected = false;
    return false;
  }

  // Prevent connecting to memory server as per prompt rules
  if (mongoUri.includes('memory') || mongoUri.includes('127.0.0.1:0')) {
    lastError = 'In-memory MongoDB substitute is strictly prohibited.';
    console.error('❌ [MongoDB Atlas] In-memory MongoDB is strictly prohibited in NOVARA COMMERCE.');
    isConnected = false;
    return false;
  }

  try {
    console.log('🔄 [MongoDB Atlas] Connecting to MongoDB Atlas cluster...');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    isConnected = conn.connection.readyState === 1;
    lastError = null;
    console.log(`✅ [MongoDB Atlas] Successfully connected to database: ${conn.connection.name} at host: ${conn.connection.host}`);
    return true;
  } catch (err: any) {
    isConnected = false;
    lastError = err?.message || 'Failed to connect to MongoDB Atlas cluster';
    console.error(`❌ [MongoDB Atlas] Connection error: ${lastError}`);
    return false;
  }
}

export function getDbStatus(): DbStatus {
  const mongoUri = process.env.MONGODB_URI;
  const uriConfigured = Boolean(mongoUri && mongoUri.trim() !== '');

  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    uriConfigured,
    databaseName: mongoose.connection?.name || undefined,
    host: mongoose.connection?.host || undefined,
    message: isConnected
      ? 'Connected to MongoDB Atlas cluster.'
      : uriConfigured
      ? `Connection to Atlas cluster failed: ${lastError || 'Timeout or invalid credentials'}`
      : 'MONGODB_URI environment variable is not configured. Set MONGODB_URI in your environment or Render settings.',
    lastChecked: new Date().toISOString(),
  };
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
