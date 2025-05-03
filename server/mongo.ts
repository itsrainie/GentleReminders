import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectToMongoDB = async () => {
  // Use a MongoDB Atlas free tier URL or default to local MongoDB
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gentlereminders';
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default connectToMongoDB;