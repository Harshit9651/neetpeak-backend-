const mongoose = require('mongoose');
require('dotenv').config
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_REMOTE_URL, {
      serverSelectionTimeoutMS: 30000  });
    console.log('MongoDB connected successfully');

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

 module.exports = connectDB;

