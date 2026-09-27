const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssc_chsl_maths_planner';

  // Return existing connection if ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`[MongoDB Connected]: ${m.connection.host}/${m.connection.name}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
