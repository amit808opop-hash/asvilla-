const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

let isMongoConnected = false;
let lastError = null;
const TARGET_DB_NAME = process.env.MONGO_DB_NAME || 'asvilla_hotel_booking';

async function connectDB() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri || !mongoUri.trim()) {
    console.log('ℹ️  MONGO_URI not configured in environment variables.');
    return {
      connected: false,
      type: 'persistent_document_store',
      uriConfigured: false,
    };
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri.trim(), {
      dbName: TARGET_DB_NAME,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    isMongoConnected = true;
    lastError = null;
    console.log(`✅ MongoDB Atlas connected successfully to database: "${mongoose.connection.name}"`);
    return {
      connected: true,
      type: 'mongodb_atlas',
      databaseName: mongoose.connection.name,
      host: mongoose.connection.host,
    };
  } catch (err) {
    isMongoConnected = false;
    lastError = err.message;
    console.error('❌ MongoDB Atlas connection error:', err.message);
    if (err.message && (err.message.includes('whitelist') || err.message.includes('Could not connect to any servers'))) {
      console.error('⚠️  IP Whitelist issue: In MongoDB Atlas Dashboard -> Network Access, add 0.0.0.0/0 to allow connections.');
    }
    return {
      connected: false,
      type: 'persistent_document_store',
      error: err.message,
    };
  }
}

function getDatabaseStatus() {
  return {
    connected: isMongoConnected && mongoose.connection.readyState === 1,
    type: isMongoConnected ? 'mongodb_atlas' : 'persistent_document_store',
    databaseName: TARGET_DB_NAME,
    error: lastError,
  };
}

module.exports = {
  connectDB,
  getDatabaseStatus,
};
