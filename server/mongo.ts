import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gentlereminders';

// Set strictQuery option
mongoose.set('strictQuery', false);

// Initialize connection variable
let connection: mongoose.Connection | null = null;

// MongoDB connection
const connectToMongoDB = async () => {
  if (!connection) {
    try {
      // Connect only if not already connected
      await mongoose.connect(uri);
      connection = mongoose.connection;
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }
  return connection;
};

// Create a connection immediately so schemas can use it
mongoose.connect(uri)
  .then(() => console.log('Initial MongoDB connection successful'))
  .catch(err => console.error('Initial MongoDB connection failed:', err));

export default connectToMongoDB;