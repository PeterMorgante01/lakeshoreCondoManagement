const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("⚠️  MONGO_URI not set. Server will run WITHOUT DB (Phase 1).");
    return null;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.warn("Continuing without DB for Phase 1.");
    return null;
  }
}

module.exports = connectDB;