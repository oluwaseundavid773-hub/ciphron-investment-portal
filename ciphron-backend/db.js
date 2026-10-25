const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  // Already connected
  if (mongoose.connection.readyState === 1) return;

  // Connection was dropped: allow a fresh attempt
  if (mongoose.connection.readyState === 0) connectionPromise = null;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 5
      })
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
        connectionPromise = null;
        console.error('Database connection error:', err.message);
      });
  }

  await connectionPromise;
};

module.exports = connectDB;
