import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { HotelModel, RoomModel } from '../models/Hotel';
import { UserModel } from '../models/User';
import { BookingModel } from '../models/Booking';
import { getDb } from '../../src/server/db';

dotenv.config({ override: true });

export interface DatabaseStatus {
  connected: boolean;
  type: 'mongodb_atlas' | 'persistent_document_store';
  uriConfigured: boolean;
  databaseName?: string;
  error?: string;
  resolution?: string;
}

let isMongoConnected = false;
let lastMongoError: string | null = null;

/**
 * Remove credentials from MongoDB URI for safe logging
 */
export function sanitizeMongoUri(uri: string): string {
  try {
    return uri.replace(/:([^@]+)@/, ':****@');
  } catch {
    return 'mongodb+srv://[credentials_hidden]';
  }
}

/**
 * Seed MongoDB Atlas collections if they are currently empty
 */
async function seedAtlasDatabase(): Promise<void> {
  try {
    const hotelCount = await HotelModel.countDocuments();
    if (hotelCount === 0) {
      console.log('🌱 MongoDB Atlas is empty. Seeding initial ASVILLA luxury hotels...');
      const localDb = await getDb();

      if (localDb.hotels && localDb.hotels.length > 0) {
        for (const h of localDb.hotels) {
          const doc: any = { ...h };
          await HotelModel.updateOne({ _id: h._id }, { $set: doc }, { upsert: true });
        }
        console.log(`✅ Seeded ${localDb.hotels.length} luxury hotels into MongoDB Atlas collection [hotels]`);
      }

      if (localDb.rooms && localDb.rooms.length > 0) {
        for (const r of localDb.rooms) {
          const rDoc: any = { ...r };
          await RoomModel.updateOne({ _id: r._id }, { $set: rDoc }, { upsert: true });
        }
        console.log(`✅ Seeded ${localDb.rooms.length} room categories into MongoDB Atlas collection [rooms]`);
      }
    } else {
      console.log(`ℹ️  MongoDB Atlas contains ${hotelCount} existing hotel sanctuaries. Skipping initial seed.`);
    }

    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      const localDb = await getDb();
      if (localDb.users && localDb.users.length > 0) {
        for (const u of localDb.users) {
          const uDoc: any = { ...u };
          await UserModel.updateOne({ _id: u._id }, { $set: uDoc }, { upsert: true });
        }
        console.log(`✅ Seeded ${localDb.users.length} initial accounts (admin & demo) into MongoDB Atlas collection [users]`);
      }
    }
  } catch (seedErr: any) {
    console.error('⚠️  Failed to seed MongoDB Atlas collections:', seedErr.message);
  }
}

/**
 * Connect to MongoDB Atlas using Mongoose and process.env.MONGODB_URI
 */
export async function connectDB(): Promise<DatabaseStatus> {
  // Re-use existing connection in serverless / warm container environments (e.g. Vercel)
  if (isMongoConnected && mongoose.connection.readyState === 1) {
    return {
      connected: true,
      type: 'mongodb_atlas',
      uriConfigured: true,
      databaseName: mongoose.connection.name || 'asvilla_hotel_booking',
    };
  }

  let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (mongoUri && !mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    if (process.env.MONGO_URI && (process.env.MONGO_URI.startsWith('mongodb://') || process.env.MONGO_URI.startsWith('mongodb+srv://'))) {
      mongoUri = process.env.MONGO_URI;
    }
  }

  if (mongoUri && mongoUri.trim() !== '') {
    const safeUri = sanitizeMongoUri(mongoUri);
    console.log(`📡 Connecting to MongoDB Atlas: ${safeUri}`);

    try {
      // Connect to Atlas cluster with timeout
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
      });

      isMongoConnected = true;
      lastMongoError = null;
      const dbName = mongoose.connection.name || 'asvilla_hotel_booking';
      console.log(`✅ MongoDB Atlas connected successfully to database: [${dbName}]`);

      // Seed sample hotels and rooms into Atlas if empty
      await seedAtlasDatabase();

      return {
        connected: true,
        type: 'mongodb_atlas',
        uriConfigured: true,
        databaseName: dbName,
      };
    } catch (err: any) {
      isMongoConnected = false;
      const errorMsg: string = err.message || 'Unknown connection error';
      lastMongoError = errorMsg;

      console.error('❌ MongoDB Atlas Connection Failed:');
      console.error(`   Cause: ${errorMsg}`);

      if (
        errorMsg.includes('whitelist') ||
        errorMsg.includes('Could not connect to any servers') ||
        errorMsg.includes('ETIMEDOUT')
      ) {
        console.error('   👉 FIX REQUIRED (MongoDB Atlas Network Access):');
        console.error('      Your IP address is not whitelisted in MongoDB Atlas.');
        console.error('      1. Open https://cloud.mongodb.com/');
        console.error('      2. Go to Security -> Network Access');
        console.error('      3. Click "Add IP Address" -> Click "Allow Access from Anywhere" (0.0.0.0/0)');
        console.error('      4. Click "Confirm" (takes ~1 minute to activate)');
      } else if (errorMsg.includes('bad auth') || errorMsg.includes('Authentication failed')) {
        console.error('   👉 FIX REQUIRED (MongoDB Atlas Authentication):');
        console.error('      Check database username and password in MONGODB_URI.');
      }
    }
  } else {
    console.warn('⚠️  MONGODB_URI is not configured in backend environment file.');
    lastMongoError = 'MONGODB_URI environment variable is missing';
  }

  // Ensure persistent local document store is initialized
  await getDb();

  return {
    connected: isMongoConnected,
    type: isMongoConnected ? 'mongodb_atlas' : 'persistent_document_store',
    uriConfigured: Boolean(mongoUri && mongoUri.trim() !== ''),
    error: lastMongoError || undefined,
    resolution:
      lastMongoError?.includes('whitelist') || lastMongoError?.includes('Could not connect')
        ? 'Add 0.0.0.0/0 or your current IP in MongoDB Atlas -> Security -> Network Access'
        : undefined,
  };
}

/**
 * Return live database connection status for health check
 */
export function getDatabaseStatus(): DatabaseStatus {
  const isConnected = isMongoConnected && mongoose.connection.readyState === 1;
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (isConnected) {
    return {
      connected: true,
      type: 'mongodb_atlas',
      uriConfigured: true,
      databaseName: mongoose.connection.name || 'asvilla_hotel_booking',
    };
  }

  return {
    connected: false,
    type: 'persistent_document_store',
    uriConfigured: Boolean(mongoUri && mongoUri.trim() !== ''),
    error: lastMongoError || 'Not connected to MongoDB Atlas',
    resolution:
      lastMongoError?.includes('whitelist') || lastMongoError?.includes('Could not connect')
        ? 'Add your IP (or 0.0.0.0/0) in MongoDB Atlas Console -> Security -> Network Access'
        : undefined,
  };
}

export function isAtlasActive(): boolean {
  return isMongoConnected && mongoose.connection.readyState === 1;
}
