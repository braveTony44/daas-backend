import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../config/log.init';

dotenv.config(); // Load environment variables from .env file

// Extend the Request interface to include the user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

const jwtSecret = process.env.JWT_SECRET; // Ensure this is set in your .env file

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    logger.warn('Access denied. No token provided.');
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret as string);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Invalid token: ${(error as Error).message}`);
    res.status(500).json({ message: 'Invalid token',error:(error as Error).message });
    return;
  }
};

