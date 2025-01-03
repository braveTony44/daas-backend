import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../config/log.init';

dotenv.config(); // Load environment variables from .env file

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET; // Ensure this is set in your .env file
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET; // Ensure this is set in your .env file

export const encryptPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  } catch (error) {
    logger.error(`Error encrypting password: ${(error as Error).message}`);
    throw new Error(`Error encrypting password: ${(error as Error).message}`);
  }
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: object): string => {
  if (!jwtSecret) {
    logger.warn('Please provide a secret to generate a token')
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
};

export const generateRefreshToken = (payload: object): string => {
  if (!jwtRefreshSecret) {
    logger.warn('Please provide a secret to generate a refresh token')
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  return jwt.sign(payload, jwtRefreshSecret, { expiresIn: '7d' });
};
