import express, { Request, Response, NextFunction } from "express";
import postgreRouter from './routes/postgres.routes';
import authRouter from './routes/auth.routes';
import pgDbRouter from './routes/pg.db.routes';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import logger from './config/log.init';
import userRoute from './routes/user.routes';
import cors from 'cors'

const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(morgan('dev', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));
app.use(cookieParser());

app.use('/api/v1/postgres', postgreRouter);
app.use('/api/v1/postgres/data', pgDbRouter);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/auth', authRouter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({status:'ok',message:"Service is healthy"});
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, { stack: err.stack });
    res.status(500).send('Something broke!');
});

export default app;
