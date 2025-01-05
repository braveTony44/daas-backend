import express, { Request, Response, NextFunction } from 'express';
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
import compression from 'compression';


const app = express();

// 1. Security Middlewares
app.use(helmet()); // Set secure HTTP headers
app.use(mongoSanitize()); // Sanitize user input to prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution attacks

// 2. Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// 3. CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Allow requests from trusted origins
    credentials: true, // Allow cookies to be sent
  })
);

// 4. Body Parsing and Compression
app.use(express.json({ limit: '10kb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parse URL-encoded bodies
app.use(compression()); // Compress response bodies

// 5. Cookie Parsing and CSRF Protection
app.use(cookieParser());

// 6. Logging
app.use(
  morgan('short', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// 7. Routes
app.use('/api/v1/postgres', postgreRouter);
app.use('/api/v1/postgres/data', pgDbRouter);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/auth', authRouter);

// 8. Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Service is healthy' });
});

// 9. 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
  });
});

// 10. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, { stack: err.stack });

  // Handle other errors
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong!',
  });
});

export default app;