import { Request, Response } from 'express';
import { User, IUser } from '../model/user.model';
import { encryptPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/auth.helper';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../config/log.init';


dotenv.config(); // Load environment variables from .env file

const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET; // Ensure this is set in your .env file

export const newUserSignup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ success:false,status: false, error: 'All fields are required' });
    }

    // check if user already exists
    const oldUser = await User.findOne({ $or: [{ username: username }, { email: email }] })

    if(oldUser){
      return res.status(409).json({success:false,status: false, error: 'User already exists'})
    }

    const hashedPassword = await encryptPassword(password);

    const newUser: IUser = new User({
      username,
      email,
      password:hashedPassword,
    });

    await newUser.save();
    logger.info(`User signed up: ${username}, Email: ${email}`);
    return res.status(201).json({ success:true,message: 'User created successfully' });
  } catch (error) {
    logger.error(`Error in newUserSignup: ${(error as Error).message}`);
    return res.status(500).json({ success:false,message: 'Error creating user', error: (error as Error).message });
  }
};

export const userLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      logger.warn(`Email and password are required in userLogin`);
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      logger.warn(`Login failed: User not found for email ${email}`);
      return res.status(401).json({ message: 'Invalid email' });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password for email ${email}`);
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = generateToken({ id: user._id, username: user.username });
    const refreshToken = generateRefreshToken({ id: user._id, username: user.username });

    // res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    // res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none' });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none' });

    logger.info(`User logged in: ${user.username}, Email: ${email}`);
    return res.status(200).json({ success:true,message: 'Login successful', token, refreshToken });
  } catch (error) {
    logger.error(`Error in userLogin: ${(error as Error).message}`);
    return res.status(500).json({ message: 'Error logging in', error: (error as Error).message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<any> => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    logger.warn('Refresh token not provided when trying to refresh');
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret as string);
    const newToken = generateToken({ id: (decoded as any).id, username: (decoded as any).username });
    const newRefreshToken = generateRefreshToken({ id: (decoded as any).id, username: (decoded as any).username });

    res.cookie('token', newToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    logger.info("Token refreshed successfully")
    return res.status(200).json({ message: 'Token refreshed', token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error(`Error in refreshToken: ${(error as Error).message}`);
    return res.status(401).json({ message: 'Invalid refresh token', error: (error as Error).message });
  }
};

export const logoutUser = async (req:Request, res:Response): Promise<any> => {
  try {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    logger.info("User logged out successfully")
    return res.status(200).json({ success:true,message: 'User logged out' });
  } catch (error) {
    logger.info("User failed to logged out ")
    return res.status(500).json({ success:false,message: 'Error logging out', error: (error as Error).message });
  }
}

