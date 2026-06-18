const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Node 18+ DNS resolution issues with MongoDB Atlas on Windows/Render
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Connection pool — keep connections alive between requests (critical for Render)
      maxPoolSize: 10,
      minPoolSize: 2,

      // Timeouts
      serverSelectionTimeoutMS: 10000, // 10s to find a server
      socketTimeoutMS: 45000,          // 45s socket inactivity timeout
      connectTimeoutMS: 10000,         // 10s to establish connection

      // Keep Atlas alive — heartbeat prevents idle connection drops
      heartbeatFrequencyMS: 10000,

      // Retry writes on transient errors
      retryWrites: true,
      retryReads: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Monitor connection events for production debugging
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB error: ${err.message}`);
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
