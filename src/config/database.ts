import mongoose from 'mongoose';
import logger from './log.init';

const connectDB = async (): Promise<void> => {
  let mongoUri : string
  if(process.env.NODE_ENV !== 'production'){
    mongoUri = process.env.MONGO_DEV_URL || ''
  }else{
    mongoUri = process.env.MONGO_DB_URI || ''
  }

  if (!mongoUri) {
    logger.error('MongoDB URI is not defined in the environment variables');
    process.exit(1);
  }

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(mongoUri);
      console.log(mongoUri)
      logger.info('Successfully connected to MongoDB');
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error });
      logger.info('Retrying connection to MongoDB in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    }
  };

  connectWithRetry();

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing MongoDB connection', { error: err });
      process.exit(1);
    }
  });
};

export default connectDB;
