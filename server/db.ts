import mongoose from 'mongoose';

const DATABASE_URI = process.env.DATABASE_URI;

if (!DATABASE_URI) {
  throw new Error(
    "DATABASE_URI must be set. Did you forget to add MongoDB connection string?"
  );
}

export const connectDB = async () => {
  try {
    await mongoose.connect(DATABASE_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export { mongoose };