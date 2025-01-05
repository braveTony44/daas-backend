import express, { Request, Response, NextFunction } from "express";
import postgreRouter from './routes/postgres.routes';
import authRouter from './routes/auth.routes';
import pgDbRouter from './routes/pg.db.routes';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import logger from './config/log.init';
import userRoute from './routes/user.routes';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter); 

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));


app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(hpp());
app.use(cookieParser());

app.use(morgan('dev', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Routes
app.use('/api/v1/postgres', postgreRouter);
app.use('/api/v1/postgres/data', pgDbRouter);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/auth', authRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Service is healthy' });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

export default app;